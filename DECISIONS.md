# DECISIONS.md — Décisions actées (Solana Lottery MVP)

> **Source de vérité du projet.** Ces décisions sont **verrouillées** : ne pas les rediscuter,
> ne pas les « améliorer », ne pas élargir le scope sans accord explicite de l'utilisateur.
> Toute proposition qui contredit ce fichier doit être signalée comme telle avant d'agir.
> Complément de CLAUDE.md (rôle/comportement) et TODO.txt (étapes).

---

## 0. Point de départ : reprise d'un repo existant

> Le projet ne démarre PAS d'une page blanche. Un repo existe :
> `MarginCallTM/Solana_Loto_Rust` (1 commit, janvier 2026).

**Ce qui existe déjà (à reprendre, qualité correcte) :**
- ✅ Un **backend off-chain en Rust + Axum** (PAS de Node/TS) avec PostgreSQL.
- ✅ Architecture en couches propre : `models` / `db/repositories` / `api/handlers` / `dto`.
- ✅ Workspace Cargo configuré ; schéma SQL soigné (contraintes CHECK, index, trigger updated_at, table d'audit `transactions`).
- ✅ Prix stockés en lamports (BIGINT). Logs via `tracing`, erreurs via `anyhow`.

**Ce qui N'EXISTE PAS encore (à construire from scratch) :**
- ❌ Le **programme on-chain Anchor** — le cœur du projet. Rien n'est commencé.
- ❌ Les handlers d'API sont en grande partie vides.
- ❌ Le frontend.

**Écarts connus à réconcilier (voir D9bis, D10) :**
- Le backend actuel suit un modèle **API REST où le client écrit directement en DB**,
  pas le modèle **indexer/events** prévu. À aligner une fois le programme on-chain en place.
- L'indexer était prévu en Node/TS ; l'existant est en Rust. Décision révisée (D10).

**Stratégie validée :** reprendre le backend (gain phases 8-10), construire le programme
Anchor en green-field (phases 1-7), puis réconcilier et brancher le frontend.

---

## 1. Scope du MVP

| # | Décision | Statut |
|---|---|---|
| D1 | Loterie décentralisée full-stack sur Solana, à but **portfolio/pédagogique** | ✅ acté |
| D2 | MVP = **1 ticket = 1 chance, un seul gagnant** (winner-take-all) | ✅ acté |
| D3 | **Pas** de système de numéros à matcher (5+bonusball) au MVP | ✅ hors-scope |
| D4 | **Pas** de modèle LP / house (banque par fournisseurs de liquidité) | ✅ hors-scope |
| D5 | **Pas** de cross-chain / bridging | ✅ hors-scope |

---

## 2. Stack technique (verrouillée)

| # | Décision | Statut |
|---|---|---|
| D6 | Programme on-chain en **Rust + Anchor** | ✅ acté |
| D7 | Tickets payés en **SOL natif** (pas de SPL token au MVP) | ✅ acté |
| D8 | Frontend **Next.js (React)** + `@solana/wallet-adapter` + client Anchor (IDL) | ✅ acté |
| D9 | Base de données **PostgreSQL**, rôle = **cache reconstructible** | ✅ acté |
| D9bis | Modèle cible : DB alimentée par l'**indexer/events**, jamais en écriture directe par le client. **Le backend existant devra être refactoré** vers ce modèle (il écrit actuellement en direct via l'API REST) | 🔧 à réconcilier |
| D10 | Indexer / backend off-chain en **Rust + Axum** (révisé : l'existant est en Rust, pas Node/TS — on garde Rust pour la cohérence du stack et l'apprentissage) | ✅ révisé |
| D11 | Réseau : **devnet uniquement** jusqu'à MVP complet et testé | ✅ acté |

---

## 3. Règles métier (verrouillées)

| # | Décision | Statut |
|---|---|---|
| D12 | `draw_winner` déclenché par **l'authority uniquement** (toi / cron) | ✅ acté |
| D13 | Validation tirage : authority doit être **Signer** ET `has_one = authority` | ✅ acté |
| D14 | Un round se termine sur le **temps** : `end_timestamp` fixé à l'init | ✅ acté |
| D15 | `buy_ticket` refusé si `now >= end_timestamp` | ✅ acté |
| D16 | `draw_winner` refusé si `now < end_timestamp` | ✅ acté |
| D17 | Le temps vient de `Clock::get().unix_timestamp` (échéances larges, pas à la seconde) | ✅ acté |
| D18 | Cas **0 ticket vendu** à l'échéance : fermer sans gagnant, ne jamais planter | ✅ acté |

---

## 4. Architecture on-chain (verrouillée)

### Comptes
| # | Décision | Statut |
|---|---|---|
| D19 | `Lottery` (PDA) — seeds `["lottery", round_id]` — état logique du round | ✅ acté |
| D20 | `Vault` (PDA) — seeds `["vault", round_id]` — détient les SOL, **séparé de l'état** | ✅ acté |
| D21 | `Ticket` (PDA) — **un compte par achat** (approche scalable, pas de liste inline) | ✅ acté |
| D22 | `LotteryState` enum = `Open` / `Drawing` / `Closed` | ✅ acté |

### Champs de `Lottery` (référence — noms exacts à respecter)
`round_id`, `authority`, `ticket_price`, `total_tickets`, `state`,
`winner` (ou `winner_index`), `pot_amount`, `end_timestamp`, `bump(s)`.

### Instructions (4 au MVP)
| # | Instruction | Rôle |
|---|---|---|
| D23 | `initialize_lottery(ticket_price, duration)` | authority crée le round, init Lottery + Vault |
| D24 | `buy_ticket()` | transfert SOL -> Vault, crée Ticket PDA, incrémente compteurs |
| D25 | `draw_winner()` | authority, après échéance : sélectionne l'index gagnant |
| D26 | `claim_prize()` | le gagnant retire le pot du Vault |

### Events (au minimum)
| # | Event |
|---|---|
| D27 | `TicketBought`, `WinnerDrawn`, `PrizeClaimed` (+ `LotteryInitialized` optionnel) |

---

## 5. Aléatoire (point sensible — verrouillé)

| # | Décision | Statut |
|---|---|---|
| D28 | MVP : aléatoire **on-chain simple** (slot hash + timestamp + total_tickets) | ✅ acté |
| D29 | La fonction d'aléatoire est **ISOLÉE** derrière une seule fonction/instruction | ✅ acté |
| D30 | Documenté EN CLAIR : c'est **manipulable par un validateur**, **devnet uniquement** | ✅ acté |
| D31 | Migration prévue vers **Switchboard VRF** en phase 2, sans réécrire le reste | ✅ acté |

---

## 6. Ordre de construction (verrouillé)

| # | Décision | Statut |
|---|---|---|
| D32 | Ordre : **Programme + tests -> Indexer/DB -> Frontend** | ✅ acté |
| D33 | **Jalon bloquant** : pas de frontend tant que `anchor test` n'est pas VERT | ✅ acté |
| D34 | Tester chaque instruction y compris ses **cas d'échec** | ✅ acté |
| D35 | Travail **phase par phase** (voir TODO.txt), pas de gros bloc d'un coup | ✅ acté |

---

## 7. Sécurité (non négociable)

| # | Décision | Statut |
|---|---|---|
| D36 | Valider **tous** les comptes (owner, seeds, signer) à chaque instruction | ✅ acté |
| D37 | **Aucune** arithmétique nue sur les lamports : `checked_add` / `checked_mul` | ✅ acté |
| D38 | **Aucun** `unwrap()` sauvage on-chain : erreurs Anchor custom (`#[error_code]`) | ✅ acté |
| D39 | Argent (`Vault`) strictement séparé de l'état logique (`Lottery`) | ✅ acté |
| D40 | Anti double-claim explicite dans `claim_prize` | ✅ acté |

---

## 8. Backlog phase 2 (NE PAS commencer sans accord explicite)

- Switchboard VRF (aléatoire deux-parties, à la Megapot/Pyth Entropy)
- Système de tiers de prix (plusieurs gagnants / paliers)
- Tickets en SPL token
- Page publique « provably fair » / vérification
- Dashboard de stats
- `draw_winner` permissionless
- Déploiement mainnet (uniquement après audit interne sérieux)

---

## 9. À compléter après la phase 0 (versions réelles de la stack)

> À remplir avec les sorties réelles — évite que du code soit généré pour des versions supposées.

- Rust : `__________`  (rustc --version)
- Solana CLI : `__________`  (solana --version)
- Anchor : `__________`  (anchor --version)
- Node : `__________`  (node --version)
- Gestionnaire de paquets : `__________`
- Contraintes de norme/structure École 42 éventuelles : `__________`
