import { Transfer as TransferEvent, LnProxyERC20 } from '../generated/Linear_Proxy/LnProxyERC20';
import { FeesClaimed as FeesClaimedEvent } from '../generated/LnFeeSystem/LnFeeSystem';
import { LnAsset } from '../generated/LnAsset_lUSD/LnAsset';
import { CollateralLog as CollateralEvent, RedeemCollateral as RedeemCollateralEvent, LnCollateralSystem } 
  from '../generated/LnCollateralSystem/LnCollateralSystem';
import { LnDebtSystem } from "../generated/LnAsset_lUSD/LnDebtSystem";
import { LnRewardLocker } from "../generated/LnAsset_lUSD/LnRewardLocker";

import {
  Transfer,
  Minted,
  DebtSnapshot,
  Burned,
  FeesClaimed,
  Collateral,
  RedeemCollateral,
} from '../generated/schema';

import { store, BigInt, Address, ethereum, Bytes } from '@graphprotocol/graph-ts';
import { strToBytes } from './common';
import { log } from '@graphprotocol/graph-ts';

let AddressZero = Address.fromString("0x0000000000000000000000000000000000000000");

// ropsten contract address, TODO: write some tool to make this availiable with mainnet
let linaProxyAddress = Address.fromString("0x908B56f016233E84c391eebe52Ee4d461fD8fb87");
let LnCollateralSystemAddress = Address.fromString("0x3e6cE54259886720F41e6d25973570835e3eef20");
let LnDebtSystemAddress = Address.fromString("0xc17650b3ECC76ba6cc8236C41Ed1b6A48Ea3cff5");
let LnRewardLockerAddress = Address.fromString("0x71192594A101Bf69672E41B49cfeBd7aA3E3042B");

export function handleTransferLINA(event: TransferEvent): void {
  if (event.params.from == LnCollateralSystemAddress || event.params.to == LnCollateralSystemAddress) {//if duplicate with Collateral / RedeemCollateral
    return;
  }

  let entity = new Transfer(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.source = 'LINA';
  entity.from = event.params.from;
  entity.to = event.params.to;
  entity.value = event.params.value;
  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.save();

}

// add build/burn event in LnBuildBurnSystem?
export function handleTransferAsset(event: TransferEvent): void {
  let proxyErc20 = LnProxyERC20.bind(event.address);
  let targetLnAsset = proxyErc20.target();
  let asset = LnAsset.bind(targetLnAsset);
  let keyname = 'lUSD';
  let trykeyname = asset.try_keyName();
  if (!trykeyname.reverted) {
    keyname = trykeyname.value.toString();
  }

  let isMintOrBurn = false;
  if (event.params.from == AddressZero) {// mint
    let mintEn = new Minted(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
    mintEn.account = event.transaction.from;
    mintEn.value = event.params.value;
    mintEn.source = keyname;

    mintEn.timestamp = event.block.timestamp;
    mintEn.block = event.block.number;
    mintEn.gasPrice = event.transaction.gasPrice;
    mintEn.save();
    isMintOrBurn = true;
  }
  if (event.params.to == AddressZero) {// burn
    let burnEn = new Burned(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
    burnEn.account = event.transaction.from;
    burnEn.value = event.params.value;
    burnEn.source = keyname;

    burnEn.timestamp = event.block.timestamp;
    burnEn.block = event.block.number;
    burnEn.gasPrice = event.transaction.gasPrice;
    burnEn.save();
    isMintOrBurn = true;
  }

  if (!isMintOrBurn) {
    let entity = new Transfer(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
    entity.source = keyname;
    entity.from = event.params.from;
    entity.to = event.params.to;
    entity.value = event.params.value;
    entity.timestamp = event.block.timestamp;
    entity.block = event.block.number;
    entity.save();
  } else {
    trackDebtSnapshot(event);
  }
}

function trackDebtSnapshot(event: ethereum.Event): void {
  let collateralSystem = LnCollateralSystem.bind(LnCollateralSystemAddress);
  let debtSsytem = LnDebtSystem.bind(LnDebtSystemAddress);
  let lina = LnProxyERC20.bind(linaProxyAddress);
  let rewardLocker = LnRewardLocker.bind(LnRewardLockerAddress);
  let account = event.transaction.from

  let entity = new DebtSnapshot(event.transaction.hash.toHex() + '-' + event.logIndex.toString());
  entity.block = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.account = account;
  
  // is balanceOf in use? maybe can remove
  let collateralLina = collateralSystem.GetUserCollateral(account, strToBytes("LINA"));
  let lockLina = rewardLocker.balanceOf(account);
  entity.balanceOf = lina.balanceOf(account).plus(collateralLina).plus(lockLina);

  entity.collateral = collateralSystem.GetUserTotalCollateralInUsd(account);
  entity.debtBalanceOf = debtSsytem.GetUserDebtBalanceInUsd(account).value0;
  entity.save();
}

export function handleFeesClaimed(event: FeesClaimedEvent): void {
  let entity = new FeesClaimed(event.transaction.hash.toHex() + '-' + event.logIndex.toString());

  entity.account = event.params.user;
  entity.rewardsLina = event.params.linaRewards;
  entity.rewardslusd = event.params.lUSDAmount;
  entity.block = event.block.number;
  entity.timestamp = event.block.timestamp;

  entity.save();
}

export function handleCollateralLog(event: CollateralEvent): void {
  let entity = new Collateral(event.transaction.hash.toHex() + '-' + event.logIndex.toString());

  entity.account = event.params.user;
  entity.currency = event.params._currency.toString();
  entity.value = event.params._amount;

  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.gasPrice = event.transaction.gasPrice;

  entity.save();
}

export function handleRedeemCollateral(event: RedeemCollateralEvent): void {
  let entity = new RedeemCollateral(event.transaction.hash.toHex() + '-' + event.logIndex.toString());

  entity.account = event.params.user;
  entity.currency = event.params._currency.toString();
  entity.value = event.params._amount;

  entity.timestamp = event.block.timestamp;
  entity.block = event.block.number;
  entity.gasPrice = event.transaction.gasPrice;

  entity.save();
}
