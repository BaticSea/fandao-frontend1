import { BigNumber, BigNumberish, ethers } from "ethers";
import { addresses } from "../constants";
import { abi as ierc20Abi } from "../abi/IERC20.json";
import { abi as sFANv2 } from "../abi/sFanv2.json";
import { abi as fuseProxy } from "../abi/FuseProxy.json";
import { abi as wsFAN } from "../abi/wsFAN.json";
import { abi as fiatDAO } from "../abi/FiatDAOContract.json";

import { setAll, handleContractError } from "../helpers";

import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import { RootState } from "src/store";
import { IBaseAddressAsyncThunk, ICalcUserBondDetailsAsyncThunk } from "./interfaces";
import { FiatDAOContract, FuseProxy, IERC20, IERC20__factory, SFanv2, SFanv2__factory, WsFAN } from "src/typechain";
import { GFAN__factory } from "src/typechain/factories/GFAN__factory";

interface IUserBalances {
  balances: {
    gfan: string;
    fan: string;
    sfan: string;
    fsfan: string;
    wsfan: string;
    fiatDaowsfan: string;
    wsfanAsSfan: string;
    pool: string;
  };
}

export const getBalances = createAsyncThunk(
  "account/getBalances",
  async ({ address, networkID, provider }: IBaseAddressAsyncThunk) => {
    let gFanBalance = BigNumber.from("0");
    let fanBalance = BigNumber.from("0");
    let sfanBalance = BigNumber.from("0");
    let wsfanBalance = BigNumber.from("0");
    let wsfanAsSfan = BigNumber.from("0");
    let poolBalance = BigNumber.from("0");
    let fsfanBalance = BigNumber.from(0);
    let fiatDaowsfanBalance = BigNumber.from("0");
    try {
      const gFanContract = GFAN__factory.connect(addresses[networkID].GFAN_ADDRESS, provider);
      gFanBalance = await gFanContract.balanceOf(address);
    } catch (e) {
      handleContractError(e);
    }
    try {
      const wsfanContract = new ethers.Contract(addresses[networkID].WSFAN_ADDRESS as string, wsFAN, provider) as WsFAN;
      wsfanBalance = await wsfanContract.balanceOf(address);
      // NOTE (appleseed): wsfanAsSfan is wsFAN given as a quantity of sFAN
      wsfanAsSfan = await wsfanContract.wFANTosFAN(wsfanBalance);
    } catch (e) {
      handleContractError(e);
    }
    try {
      const fanContract = new ethers.Contract(
        addresses[networkID].FAN_ADDRESS as string,
        ierc20Abi,
        provider,
      ) as IERC20;
      fanBalance = await fanContract.balanceOf(address);
    } catch (e) {
      handleContractError(e);
    }
    try {
      const sfanContract = new ethers.Contract(
        addresses[networkID].SFAN_ADDRESS as string,
        ierc20Abi,
        provider,
      ) as IERC20;
      sfanBalance = await sfanContract.balanceOf(address);
    } catch (e) {
      handleContractError(e);
    }
    try {
      const poolTokenContract = new ethers.Contract(
        addresses[networkID].PT_TOKEN_ADDRESS as string,
        ierc20Abi,
        provider,
      ) as IERC20;
      poolBalance = await poolTokenContract.balanceOf(address);
    } catch (e) {
      handleContractError(e);
    }
    try {
      for (const fuseAddressKey of ["FUSE_6_SFAN", "FUSE_18_SFAN", "FUSE_36_SFAN"]) {
        if (addresses[networkID][fuseAddressKey]) {
          const fsfanContract = new ethers.Contract(
            addresses[networkID][fuseAddressKey] as string,
            fuseProxy,
            provider.getSigner(),
          ) as FuseProxy;
          // fsfanContract.signer;
          const balanceOfUnderlying = await fsfanContract.callStatic.balanceOfUnderlying(address);
          fsfanBalance = balanceOfUnderlying.add(fsfanBalance);
        }
      }
    } catch (e) {
      handleContractError(e);
    }
    try {
      if (addresses[networkID].FIATDAO_WSFAN_ADDRESS) {
        const fiatDaoContract = new ethers.Contract(
          addresses[networkID].FIATDAO_WSFAN_ADDRESS as string,
          fiatDAO,
          provider,
        ) as FiatDAOContract;
        fiatDaowsfanBalance = await fiatDaoContract.balanceOf(address, addresses[networkID].WSFAN_ADDRESS as string);
      }
    } catch (e) {
      handleContractError(e);
    }

    return {
      balances: {
        gfan: ethers.utils.formatEther(gFanBalance),
        fan: ethers.utils.formatUnits(fanBalance, "gwei"),
        sfan: ethers.utils.formatUnits(sfanBalance, "gwei"),
        fsfan: ethers.utils.formatUnits(fsfanBalance, "gwei"),
        wsfan: ethers.utils.formatEther(wsfanBalance),
        fiatDaowsfan: ethers.utils.formatEther(fiatDaowsfanBalance),
        wsfanAsSfan: ethers.utils.formatUnits(wsfanAsSfan, "gwei"),
        pool: ethers.utils.formatUnits(poolBalance, "gwei"),
      },
    };
  },
);

interface IUserAccountDetails {
  staking: {
    fanStake: number;
    fanUnstake: number;
  };
  wrapping: {
    sfanWrap: number;
    wsfanUnwrap: number;
    gFanUnwrap: number;
  };
}

export const getMigrationAllowances = createAsyncThunk(
  "account/getMigrationAllowances",
  async ({ networkID, provider, address }: IBaseAddressAsyncThunk) => {
    let fanAllowance = BigNumber.from(0);
    let sFanAllowance = BigNumber.from(0);
    let wsFanAllowance = BigNumber.from(0);
    let gFanAllowance = BigNumber.from(0);

    if (addresses[networkID].FAN_ADDRESS) {
      try {
        const fanContract = IERC20__factory.connect(addresses[networkID].FAN_ADDRESS, provider);
        fanAllowance = await fanContract.allowance(address, addresses[networkID].MIGRATOR_ADDRESS);
      } catch (e) {
        handleContractError(e);
      }
    }

    if (addresses[networkID].SFAN_ADDRESS) {
      try {
        const sFanContract = IERC20__factory.connect(addresses[networkID].SFAN_ADDRESS, provider);
        sFanAllowance = await sFanContract.allowance(address, addresses[networkID].MIGRATOR_ADDRESS);
      } catch (e) {
        handleContractError(e);
      }
    }

    if (addresses[networkID].WSFAN_ADDRESS) {
      try {
        const wsFanContract = IERC20__factory.connect(addresses[networkID].WSFAN_ADDRESS, provider);
        wsFanAllowance = await wsFanContract.allowance(address, addresses[networkID].MIGRATOR_ADDRESS);
      } catch (e) {
        handleContractError(e);
      }
    }

    if (addresses[networkID].GFAN_ADDRESS) {
      try {
        const gFanContract = IERC20__factory.connect(addresses[networkID].GFAN_ADDRESS, provider);
        gFanAllowance = await gFanContract.allowance(address, addresses[networkID].MIGRATOR_ADDRESS);
      } catch (e) {
        handleContractError(e);
      }
    }

    return {
      migration: {
        fan: +fanAllowance,
        sfan: +sFanAllowance,
        wsfan: +wsFanAllowance,
        gfan: +gFanAllowance,
      },
      isMigrationComplete: false,
    };
  },
);

export const loadAccountDetails = createAsyncThunk(
  "account/loadAccountDetails",
  async ({ networkID, provider, address }: IBaseAddressAsyncThunk, { dispatch }) => {
    let stakeAllowance = BigNumber.from("0");
    let unstakeAllowance = BigNumber.from("0");
    let wrapAllowance = BigNumber.from("0");
    let unwrapAllowance = BigNumber.from("0");
    let gFanUnwrapAllowance = BigNumber.from("0");
    let poolAllowance = BigNumber.from("0");
    try {
      const gFanContract = GFAN__factory.connect(addresses[networkID].GFAN_ADDRESS, provider);
      gFanUnwrapAllowance = await gFanContract.allowance(address, addresses[networkID].MIGRATOR_ADDRESS);

      const fanContract = new ethers.Contract(
        addresses[networkID].FAN_ADDRESS as string,
        ierc20Abi,
        provider,
      ) as IERC20;
      stakeAllowance = await fanContract.allowance(address, addresses[networkID].STAKING_HELPER_ADDRESS);

      const sfanContract = new ethers.Contract(addresses[networkID].SFAN_ADDRESS as string, sFANv2, provider) as SFanv2;
      unstakeAllowance = await sfanContract.allowance(address, addresses[networkID].STAKING_ADDRESS);
      poolAllowance = await sfanContract.allowance(address, addresses[networkID].PT_PRIZE_POOL_ADDRESS);
      wrapAllowance = await sfanContract.allowance(address, addresses[networkID].WSFAN_ADDRESS);

      const wsfanContract = new ethers.Contract(addresses[networkID].WSFAN_ADDRESS as string, wsFAN, provider) as WsFAN;
      unwrapAllowance = await wsfanContract.allowance(address, addresses[networkID].WSFAN_ADDRESS);
    } catch (e) {
      console.warn("failed contract calls in slice", e);
    }
    await dispatch(getBalances({ address, networkID, provider }));

    return {
      staking: {
        fanStake: +stakeAllowance,
        fanUnstake: +unstakeAllowance,
      },
      wrapping: {
        fanWrap: Number(ethers.utils.formatUnits(wrapAllowance, "gwei")),
        fanUnwrap: Number(ethers.utils.formatUnits(unwrapAllowance, "gwei")),
        gFanUnwrap: Number(ethers.utils.formatUnits(gFanUnwrapAllowance, "ether")),
      },
    };
  },
);

export interface IUserBondDetails {
  // bond: string;
  allowance: number;
  interestDue: number;
  bondMaturationBlock: number;
  pendingPayout: string; //Payout formatted in gwei.
}
export const calculateUserBondDetails = createAsyncThunk(
  "account/calculateUserBondDetails",
  async ({ address, bond, networkID, provider }: ICalcUserBondDetailsAsyncThunk) => {
    if (!address) {
      return {
        bond: "",
        displayName: "",
        bondIconSvg: "",
        isLP: false,
        allowance: 0,
        balance: "0",
        interestDue: 0,
        bondMaturationBlock: 0,
        pendingPayout: "",
      };
    }
    // dispatch(fetchBondInProgress());

    // Calculate bond details.
    const bondContract = bond.getContractForBond(networkID, provider);
    const reserveContract = bond.getContractForReserve(networkID, provider);

    let pendingPayout, bondMaturationBlock;

    const bondDetails = await bondContract.bondInfo(address);
    let interestDue: BigNumberish = Number(bondDetails.payout.toString()) / Math.pow(10, 9);
    bondMaturationBlock = +bondDetails.vesting + +bondDetails.lastBlock;
    pendingPayout = await bondContract.pendingPayoutFor(address);

    let allowance,
      balance = BigNumber.from(0);
    allowance = await reserveContract.allowance(address, bond.getAddressForBond(networkID) || "");
    balance = await reserveContract.balanceOf(address);
    // formatEthers takes BigNumber => String
    const balanceVal = ethers.utils.formatEther(balance);
    // balanceVal should NOT be converted to a number. it loses decimal precision
    return {
      bond: bond.name,
      displayName: bond.displayName,
      bondIconSvg: bond.bondIconSvg,
      isLP: bond.isLP,
      allowance: Number(allowance.toString()),
      balance: balanceVal,
      interestDue,
      bondMaturationBlock,
      pendingPayout: ethers.utils.formatUnits(pendingPayout, "gwei"),
    };
  },
);

interface IAccountSlice extends IUserAccountDetails, IUserBalances {
  bonds: { [key: string]: IUserBondDetails };
  balances: {
    gfan: string;
    fan: string;
    sfan: string;
    dai: string;
    oldsfan: string;
    fsfan: string;
    wsfan: string;
    fiatDaowsfan: string;
    wsfanAsSfan: string;
    pool: string;
  };
  loading: boolean;
  staking: {
    fanStake: number;
    fanUnstake: number;
  };
  migration: {
    fan: number;
    sfan: number;
    wsfan: number;
    gfan: number;
  };
  pooling: {
    sfanPool: number;
  };
}

const initialState: IAccountSlice = {
  loading: false,
  bonds: {},
  balances: {
    gfan: "",
    fan: "",
    sfan: "",
    dai: "",
    oldsfan: "",
    fsfan: "",
    wsfan: "",
    fiatDaowsfan: "",
    pool: "",
    wsfanAsSfan: "",
  },
  staking: { fanStake: 0, fanUnstake: 0 },
  wrapping: { sfanWrap: 0, wsfanUnwrap: 0, gFanUnwrap: 0 },
  pooling: { sfanPool: 0 },
  migration: { fan: 0, sfan: 0, wsfan: 0, gfan: 0 },
};

const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    fetchAccountSuccess(state, action) {
      setAll(state, action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadAccountDetails.pending, state => {
        state.loading = true;
      })
      .addCase(loadAccountDetails.fulfilled, (state, action) => {
        setAll(state, action.payload);
        state.loading = false;
      })
      .addCase(loadAccountDetails.rejected, (state, { error }) => {
        state.loading = false;
        console.log(error);
      })
      .addCase(getBalances.pending, state => {
        state.loading = true;
      })
      .addCase(getBalances.fulfilled, (state, action) => {
        setAll(state, action.payload);
        state.loading = false;
      })
      .addCase(getBalances.rejected, (state, { error }) => {
        state.loading = false;
        console.log(error);
      })
      .addCase(calculateUserBondDetails.pending, state => {
        state.loading = true;
      })
      .addCase(calculateUserBondDetails.fulfilled, (state, action) => {
        if (!action.payload) return;
        const bond = action.payload.bond;
        state.bonds[bond] = action.payload;
        state.loading = false;
      })
      .addCase(calculateUserBondDetails.rejected, (state, { error }) => {
        state.loading = false;
        console.log(error);
      })
      .addCase(getMigrationAllowances.fulfilled, (state, action) => {
        setAll(state, action.payload);
      })
      .addCase(getMigrationAllowances.rejected, (state, { error }) => {
        console.log(error);
      });
  },
});

export default accountSlice.reducer;

export const { fetchAccountSuccess } = accountSlice.actions;

const baseInfo = (state: RootState) => state.account;

export const getAccountState = createSelector(baseInfo, account => account);
