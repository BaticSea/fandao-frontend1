import { useSelector } from "react-redux";
import { trim, formatCurrency } from "../../../../helpers";
import Metric from "src/components/Metric/Metric";
import { t } from "@lingui/macro";

const sharedProps = {
  labelVariant: "h6",
  metricVariant: "h5",
};

export const MarketCap = () => {
  const marketCap = useSelector(state => state.app.marketCap || 0);
  return (
    <Metric
      className="metric market"
      label={t`Market Cap`}
      metric={formatCurrency(marketCap, 0)}
      isLoading={marketCap ? false : true}
      {...sharedProps}
    />
  );
};

export const LIONPrice = () => {
  const marketPrice = useSelector(state => state.app.marketPrice);
  return (
    <Metric
      className="metric price"
      label={t`LION Price`}
      metric={marketPrice && formatCurrency(marketPrice, 2)}
      isLoading={marketPrice ? false : true}
      {...sharedProps}
    />
  );
};

export const CircSupply = () => {
  const circSupply = useSelector(state => state.app.circSupply);
  const totalSupply = useSelector(state => state.app.totalSupply);
  const isDataLoaded = circSupply && totalSupply;
  return (
    <Metric
      className="metric circ"
      label={t`Circulating Supply (total)`}
      metric={isDataLoaded && parseInt(circSupply) + " / " + parseInt(totalSupply)}
      isLoading={isDataLoaded ? false : true}
      {...sharedProps}
    />
  );
};

export const BackingPerLION = () => {
  const backingPerLion = useSelector(state => state.app.treasuryMarketValue / state.app.circSupply);
  return (
    <Metric
      className="metric bpo"
      label={t`Backing per LION`}
      metric={!isNaN(backingPerLion) && formatCurrency(backingPerLion, 2)}
      isLoading={backingPerLion ? false : true}
      {...sharedProps}
    />
  );
};

export const CurrentIndex = () => {
  const currentIndex = useSelector(state => state.app.currentIndex);
  return (
    <Metric
      className="metric index"
      label={t`Current Index`}
      metric={currentIndex && trim(currentIndex, 2) + " sLION"}
      isLoading={currentIndex ? false : true}
      {...sharedProps}
      tooltip="The current index tracks the amount of sLION accumulated since the beginning of staking. Basically, how much sLION one would have if they staked and held a single LION from day 1."
    />
  );
};

export const WSLIONPrice = () => {
  const wsLionPrice = useSelector(state => state.app.marketPrice * state.app.currentIndex);
  return (
    <Metric
      className="metric wsoprice"
      label={t`wsLION Price`}
      metric={wsLionPrice && formatCurrency(wsLionPrice, 2)}
      isLoading={wsLionPrice ? false : true}
      {...sharedProps}
      tooltip={`wsLION = sLION * index\n\nThe price of wsLION is equal to the price of LION multiplied by the current index`}
    />
  );
};
