import { BigNumber, BigNumberish, ethers } from "ethers";
import { addresses } from "../constants";
import { abi as ierc20Abi } from "../abi/IERC20.json";
import { abi as sLIONv2 } from "../abi/sLionv2.json";
import { abi as fuseProxy } from "../abi/FuseProxy.json";
import { abi as wsLION } from "../abi/wsLION.json";
import { abi as fiatDAO } from "../abi/FiatDAOContract.json";

import { setAll, handleContractError } from "../helpers";

import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import { RootState } from "src/store";
import { IBaseAddressAsyncThunk, ICalcUserBondDetailsAsyncThunk } from "./interfaces";
import { FiatDAOContract, FuseProxy, IERC20, IERC20__factory, SLionv2, SLionv2__factory, WsLION } from "src/typechain";
import { GLION__factory } from "src/typechain/factories/GLION__factory";

interface IUserBalances {
  balances: {
    glion: string;
    lion: string;
    slion: string;
    fslion: string;
    wslion: string;
    fiatDaowslion: string;
    wslionAsSlion: string;
    pool: string;
  };
}

export const getBalances = createAsyncThunk(
  "account/getBalances",
  async ({ address, networkID, provider }: IBaseAddressAsyncThunk) => {
    let gLionBalance = BigNumber.from("0");
    let lionBalance = BigNumber.from("0");
    let slionBalance = BigNumber.from("0");
    let wslionBalance = BigNumber.from("0");
    let wslionAsSlion = BigNumber.from("0");
    let poolBalance = BigNumber.from("0");
    let fslionBalance = BigNumber.from(0);
    let fiatDaowslionBalance = BigNumber.from("0");
    try {
      const gLionContract = GLION__factory.connect(addresses[networkID].GLION_ADDRESS, provider);
      gLionBalance = await gLionContract.balanceOf(address);
    } catch (e) {
      handleContractError(e);
    }
    try {
      const wslionContract = new ethers.Contract(
        addresses[networkID].WSLION_ADDRESS as string,
        wsLION,
        provider,
      ) as WsLION;
      wslionBalance = await wslionContract.balanceOf(address);
      // NOTE (appleseed): wslionAsSlion is wsLION given as a quantity of sLION
      wslionAsSlion = await wslionContract.wLIONTosLION(wslionBalance);
    } catch (e) {
      handleContractError(e);
    }
    try {
      const lionContract = new ethers.Contract(
        addresses[networkID].LION_ADDRESS as string,
        ierc20Abi,
        provider,
      ) as IERC20;
      lionBalance = await lionContract.balanceOf(address);
    } catch (e) {
      handleContractError(e);
    }
    try {
      const slionContract = new ethers.Contract(
        addresses[networkID].SLION_ADDRESS as string,
        ierc20Abi,
        provider,
      ) as IERC20;
      slionBalance = await slionContract.balanceOf(address);
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
      for (const fuseAddressKey of ["FUSE_6_SLION", "FUSE_18_SLION", "FUSE_36_SLION"]) {
        if (addresses[networkID][fuseAddressKey]) {
          const fslionContract = new ethers.Contract(
            addresses[networkID][fuseAddressKey] as string,
            fuseProxy,
            provider.getSigner(),
          ) as FuseProxy;
          // fslionContract.signer;
          const balanceOfUnderlying = await fslionContract.callStatic.balanceOfUnderlying(address);
          fslionBalance = balanceOfUnderlying.add(fslionBalance);
        }
      }
    } catch (e) {
      handleContractError(e);
    }
    try {
      if (addresses[networkID].FIATDAO_WSLION_ADDRESS) {
        const fiatDaoContract = new ethers.Contract(
          addresses[networkID].FIATDAO_WSLION_ADDRESS as string,
          fiatDAO,
          provider,
        ) as FiatDAOContract;
        fiatDaowslionBalance = await fiatDaoContract.balanceOf(address, addresses[networkID].WSLION_ADDRESS as string);
      }
    } catch (e) {
      handleContractError(e);
    }

    return {
      balances: {
        glion: ethers.utils.formatEther(gLionBalance),
        lion: ethers.utils.formatUnits(lionBalance, "gwei"),
        slion: ethers.utils.formatUnits(slionBalance, "gwei"),
        fslion: ethers.utils.formatUnits(fslionBalance, "gwei"),
        wslion: ethers.utils.formatEther(wslionBalance),
        fiatDaowslion: ethers.utils.formatEther(fiatDaowslionBalance),
        wslionAsSlion: ethers.utils.formatUnits(wslionAsSlion, "gwei"),
        pool: ethers.utils.formatUnits(poolBalance, "gwei"),
      },
    };
  },
);

interface IUserAccountDetails {
  staking: {
    lionStake: number;
    lionUnstake: number;
  };
  wrapping: {
    slionWrap: number;
    wslionUnwrap: number;
    gLionUnwrap: number;
  };
}

export const getMigrationAllowances = createAsyncThunk(
  "account/getMigrationAllowances",
  async ({ networkID, provider, address }: IBaseAddressAsyncThunk) => {
    let lionAllowance = BigNumber.from(0);
    let sLionAllowance = BigNumber.from(0);
    let wsLionAllowance = BigNumber.from(0);
    let gLionAllowance = BigNumber.from(0);

    if (addresses[networkID].LION_ADDRESS) {
      try {
        const lionContract = IERC20__factory.connect(addresses[networkID].LION_ADDRESS, provider);
        lionAllowance = await lionContract.allowance(address, addresses[networkID].MIGRATOR_ADDRESS);
      } catch (e) {
        handleContractError(e);
      }
    }

    if (addresses[networkID].SLION_ADDRESS) {
      try {
        const sLionContract = IERC20__factory.connect(addresses[networkID].SLION_ADDRESS, provider);
        sLionAllowance = await sLionContract.allowance(address, addresses[networkID].MIGRATOR_ADDRESS);
      } catch (e) {
        handleContractError(e);
      }
    }

    if (addresses[networkID].WSLION_ADDRESS) {
      try {
        const wsLionContract = IERC20__factory.connect(addresses[networkID].WSLION_ADDRESS, provider);
        wsLionAllowance = await wsLionContract.allowance(address, addresses[networkID].MIGRATOR_ADDRESS);
      } catch (e) {
        handleContractError(e);
      }
    }

    if (addresses[networkID].GLION_ADDRESS) {
      try {
        const gLionContract = IERC20__factory.connect(addresses[networkID].GLION_ADDRESS, provider);
        gLionAllowance = await gLionContract.allowance(address, addresses[networkID].MIGRATOR_ADDRESS);
      } catch (e) {
        handleContractError(e);
      }
    }

    return {
      migration: {
        lion: +lionAllowance,
        slion: +sLionAllowance,
        wslion: +wsLionAllowance,
        glion: +gLionAllowance,
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
    let gLionUnwrapAllowance = BigNumber.from("0");
    let poolAllowance = BigNumber.from("0");
    try {
      const gLionContract = GLION__factory.connect(addresses[networkID].GLION_ADDRESS, provider);
      gLionUnwrapAllowance = await gLionContract.allowance(address, addresses[networkID].MIGRATOR_ADDRESS);

      const lionContract = new ethers.Contract(
        addresses[networkID].LION_ADDRESS as string,
        ierc20Abi,
        provider,
      ) as IERC20;
      stakeAllowance = await lionContract.allowance(address, addresses[networkID].STAKING_HELPER_ADDRESS);

      const slionContract = new ethers.Contract(
        addresses[networkID].SLION_ADDRESS as string,
        sLIONv2,
        provider,
      ) as SLionv2;
      unstakeAllowance = await slionContract.allowance(address, addresses[networkID].STAKING_ADDRESS);
      poolAllowance = await slionContract.allowance(address, addresses[networkID].PT_PRIZE_POOL_ADDRESS);
      wrapAllowance = await slionContract.allowance(address, addresses[networkID].WSLION_ADDRESS);

      const wslionContract = new ethers.Contract(
        addresses[networkID].WSLION_ADDRESS as string,
        wsLION,
        provider,
      ) as WsLION;
      unwrapAllowance = await wslionContract.allowance(address, addresses[networkID].WSLION_ADDRESS);
    } catch (e) {
      console.warn("failed contract calls in slice", e);
    }
    await dispatch(getBalances({ address, networkID, provider }));

    return {
      staking: {
        lionStake: +stakeAllowance,
        lionUnstake: +unstakeAllowance,
      },
      wrapping: {
        lionWrap: Number(ethers.utils.formatUnits(wrapAllowance, "gwei")),
        lionUnwrap: Number(ethers.utils.formatUnits(unwrapAllowance, "gwei")),
        gLionUnwrap: Number(ethers.utils.formatUnits(gLionUnwrapAllowance, "ether")),
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
    glion: string;
    lion: string;
    slion: string;
    dai: string;
    oldslion: string;
    fslion: string;
    wslion: string;
    fiatDaowslion: string;
    wslionAsSlion: string;
    pool: string;
  };
  loading: boolean;
  staking: {
    lionStake: number;
    lionUnstake: number;
  };
  migration: {
    lion: number;
    slion: number;
    wslion: number;
    glion: number;
  };
  pooling: {
    slionPool: number;
  };
}

const initialState: IAccountSlice = {
  loading: false,
  bonds: {},
  balances: {
    glion: "",
    lion: "",
    slion: "",
    dai: "",
    oldslion: "",
    fslion: "",
    wslion: "",
    fiatDaowslion: "",
    pool: "",
    wslionAsSlion: "",
  },
  staking: { lionStake: 0, lionUnstake: 0 },
  wrapping: { slionWrap: 0, wslionUnwrap: 0, gLionUnwrap: 0 },
  pooling: { slionPool: 0 },
  migration: { lion: 0, slion: 0, wslion: 0, glion: 0 },
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
