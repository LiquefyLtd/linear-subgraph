import { Transfer as TransferEvent } from '../generated/LnProxyERC20';
import { FeesClaimed as FeesClaimedEvent } from '../generated/FeePool/FeePool';
//LnAsset

import {
  Transfer,
  Minted,
  Builder,
  DebtSnapshot,
  AssetHolder,
  Burned,
  FeesClaimed,
} from '../generated/schema';

import { store, BigInt, Address, ethereum, Bytes } from '@graphprotocol/graph-ts';
import { strToBytes } from './common';
import { log } from '@graphprotocol/graph-ts';

export function handleTransferLINA(event: TransferEvent): void {
  let entity = new Transfer(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.source = 'LINA';
  entity.from = event.params.from;
  entity.to = event.params.to;
  entity.value = event.params.value;
  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.save();

  //trackLINAHolder(event.address, event.params.from, event.block, event.transaction);
  //trackLINAHolder(event.address, event.params.to, event.block, event.transaction);
}

export function handleTransferAsset(event: TransferEvent): void {
  //let contract = LnAsset.bind(event.address);
  let entity = new Transfer(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.source = 'lUSD';
  entity.from = event.params.from;
  entity.to = event.params.to;
  entity.value = event.params.value;
  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.save();

}

export function handleFeesClaimed(event: FeesClaimedEvent): void {
  let entity = new FeesClaimed(event.transaction.hash.toHex() + '-' + event.logIndex.toString());

  entity.account = event.params.account;
  entity.rewards = event.params.LINARewards;
  entity.value = event.params.lUSDAmount;
  entity.block = event.block.number;
  entity.timestamp = event.block.timestamp;

  entity.save();

/*
  let LINAHolder = LINAHolder.load(entity.account.toHexString());
  if (LINAHolder != null) {
    if (LINAHolder.claims == null) {
      LINAHolder.claims = BigInt.fromI32(0);
    }
    LINAHolder.claims = LINAHolder.claims.plus(BigInt.fromI32(1));
    LINAHolder.save();
  }*/
}
