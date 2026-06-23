// Off-chain decoding of the program's Anchor events.
//
// Anchor's `emit!` macro logs an event via the `sol_log_data` syscall, which
// surfaces in a transaction's log messages as a single line:
//
//     Program data: <base64>
//
// The decoded bytes are: [8-byte discriminator] ++ [Borsh-serialized fields].
// The discriminator equals sha256("event:<EventName>")[..8]; we copy the exact
// values from the generated IDL (target/idl/lottery.json) so we never guess.
//
// SECURITY — this data is UNTRUSTED. A transaction that touches our program can
// also invoke other programs, and any of them can emit "Program data:" lines.
// We therefore (1) only decode lines emitted while OUR program is the executing
// one (tracked via the invoke/success stack), (2) check the length before
// slicing, and (3) treat any decode failure as "skip", never a panic.

use base64::prelude::*;
use borsh::{BorshDeserialize, BorshSerialize};

// -- Event discriminators, copied verbatim from target/idl/lottery.json ---
const DISC_LOTTERY_INITIALIZED: [u8; 8] = [198, 188, 153, 94, 232, 47, 124, 219];
const DISC_TICKET_BOUGHT: [u8; 8] = [80, 244, 35, 181, 211, 143, 3, 166];
const DISC_WINNER_DRAWN: [u8; 8] = [213, 103, 5, 118, 145, 75, 146, 120];
const DISC_PRIZE_CLAIMED: [u8; 8] = [213, 150, 192, 76, 199, 33, 212, 38];

// On the wire a Pubkey is just 32 raw bytes. We keep it as [u8; 32] here to stay
// decoupled from anchor-lang/solana-sdk in the decoder; the dispatch layer (9.4)
// converts it to a base58 string for the DB.
type RawPubkey = [u8; 32];

#[derive(BorshDeserialize, BorshSerialize, Debug, Clone, PartialEq)]
pub struct LotteryInitialized {
    pub round_id: u64,
    pub authority: RawPubkey,
    pub ticket_price: u64,
    pub end_timestamp: i64,
}

#[derive(BorshDeserialize, BorshSerialize, Debug, Clone, PartialEq)]
pub struct TicketBought {
    pub round_id: u64,
    pub buyer: RawPubkey,
    pub index: u64,
}

#[derive(BorshDeserialize, BorshSerialize, Debug, Clone, PartialEq)]
pub struct WinnerDrawn {
    pub round_id: u64,
    pub winner_index: Option<u64>,
}

#[derive(BorshDeserialize, BorshSerialize, Debug, Clone, PartialEq)]
pub struct PrizeClaimed {
    pub round_id: u64,
    pub winner: RawPubkey,
    pub amount: u64,
}

// A successfully decoded event, tagged by kind.
#[derive(Debug, Clone, PartialEq)]
pub enum LotteryEvent {
    Initialized(LotteryInitialized),
    TicketBought(TicketBought),
    WinnerDrawn(WinnerDrawn),
    PrizeClaimed(PrizeClaimed),
}

// Decode one "Program data:" payload (already stripped of the prefix).
// Returns None for anything that isn't one of OUR well-formed events.
fn decode_event_payload(b64: &str) -> Option<LotteryEvent> {
    // 1. base64 -> raw bytes. Untrusted input: a decode error is just "skip".
    let bytes = BASE64_STANDARD.decode(b64).ok()?;

    // 2. Length guard before slicing off the 8-byte discriminator.
    if bytes.len() < 8 {
        return None;
    }
    let (disc, payload) = bytes.split_at(8);
    let disc: [u8; 8] = disc.try_into().ok()?;

    // 3. Match the discriminator, then Borsh-decode the rest. try_from_slice
    //    also fails on leftover bytes, which validates the exact length.
    let event = if disc == DISC_LOTTERY_INITIALIZED {
        LotteryEvent::Initialized(LotteryInitialized::try_from_slice(payload).ok()?)
    } else if disc == DISC_TICKET_BOUGHT {
        LotteryEvent::TicketBought(TicketBought::try_from_slice(payload).ok()?)
    } else if disc == DISC_WINNER_DRAWN {
        LotteryEvent::WinnerDrawn(WinnerDrawn::try_from_slice(payload).ok()?)
    } else if disc == DISC_PRIZE_CLAIMED {
        LotteryEvent::PrizeClaimed(PrizeClaimed::try_from_slice(payload).ok()?)
    } else {
        // Unknown discriminator: not our event (or a future one). Ignore.
        return None;
    };
    Some(event)
}

// Decode every event OUR program emitted in a transaction's log messages.
//
// 'logs' is meta.log_messages from the RPC; 'program_id' is our base58 id.
// We walk the invoke/success stack so a "Program data:" line is only decoded
// while OUR program is the one currently executing (CPI-safe scoping)
pub fn decode_program_events(logs: &[String], program_id: &str) -> Vec<LotteryEvent> {
    let mut events = Vec::new();
    let mut stack: Vec<&str> = Vec::new(); // Program ids currently executing.

    for line in logs {
        if let Some(rest) = line.strip_prefix("Program ") {
            // "Program <id> invoke [<depth>]" -> a program starts executing.
            if let Some(pos) = rest.find(" invoke [") {
                stack.push(&rest[..pos]);
                continue;
            }
            // "Program <id> success" / "Program <id> failed: ..." -> it returns.
            if rest.ends_with(" success") || rest.contains(" failed") {
                stack.pop();
                continue;
            }
        }
        // "Program data: <base64>" -> an emitted event, but only ours counts.
        if let Some(b64) = line.strip_prefix("Program data: ") {
            if stack.last().copied() == Some(program_id) {
                if let Some(ev) = decode_event_payload(b64) {
                    events.push(ev);
                }
            }
        }
    }
    events
}

#[cfg(test)]
mod tests {
    use super::*;

    // Build a "Program data: line the way the on-chain program would:"
    // discriminator ++ borsh payload, then base64.
    fn program_data_line(disc: [u8; 8], payload: Vec<u8>) -> String {
        let mut bytes = disc.to_vec();
        bytes.extend(payload);
        format!("Program data: {}", BASE64_STANDARD.encode(bytes))
    }

    #[test]
    fn decodes_ticket_bought_in_our_scope() {
        let prog = "DD5CPAQWUtKSBajtNT9w4QbJysQnuWeDZ6yCdXKAYwro";
        let ev = TicketBought {round_id: 7, buyer: [9u8; 32], index: 3};
        let logs = vec![
            format!("Program {prog} invoke [1]"),
            "Program log: Instruction: BuyTicket".to_string(),
            program_data_line(DISC_TICKET_BOUGHT, borsh::to_vec(&ev).unwrap()),
            format!("Program {prog} success"),
        ];
        assert_eq!(
            decode_program_events(&logs, prog),
            vec![LotteryEvent::TicketBought(ev)]
        );
    }

    #[test]
    fn ignores_program_data_from_another_program() {
        let ours = "DD5CPAQWUtKSBajtNT9w4QbJysQnuWeDZ6yCdXKAYwro";
        let other = "11111111111111111111111111111111";
        let ev = TicketBought { round_id: 1, buyer: [1u8; 32], index: 0 };
        // Emitted while ANOTHER program is on top of the stack -> must be
        // ignored, even though the discriminator matches ours.
        let logs = vec![
            format!("Program {ours} invoke [1]"),
            format!("Program {other} invoke [2]"),
            program_data_line(DISC_TICKET_BOUGHT, borsh::to_vec(&ev).unwrap()),
            format!("Program {other} success"),
            format!("Program {ours} success"),
        ];
        assert!(decode_program_events(&logs, ours).is_empty());
    }
}
