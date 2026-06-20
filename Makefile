export CARGO_TARGET_DIR := $(CURDIR)/target

.PHONY: build test deploy deploy-devnet idl-devnet clean

build:
	anchor build

test:
	anchor test

# Deploy to whatever cluster Anchor.toml [provider] points to (localnet by default).
deploy:
	anchor deploy

# Deploy the program to devnet (keeps tests on localnet).
deploy-devnet:
	anchor deploy --provider.cluster devnet

# Publish the IDL on-chain on devnet (so clients can fetch it).
idl-devnet:
	anchor idl init --provider.cluster devnet \
		--filepath target/idl/lottery.json \
		DD5CPAQWUtKSBajtNT9w4QbJysQnuWeDZ6yCdXKAYwro

clean:
	anchor clean
	rm -rf programs/lottery/target
