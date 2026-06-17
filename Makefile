export CARGO_TARGET_DIR := $(CURDIR)/target

.PHONY: build test deploy clean

build:
	anchor build

test:
	anchor test

deploy:
	anchor deploy

clean:
	anchor clean
	rm -rf programs/lottery/target
