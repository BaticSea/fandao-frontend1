import { useState } from "react";
import { addresses, TOKEN_DECIMALS } from "../../constants";
import { NavLink } from "react-router-dom";
import { Link, SvgIcon, Popper, Button, Paper, Typography, Divider, Box, Fade, Slide } from "@material-ui/core";
import { ReactComponent as InfoIcon } from "../../assets/icons/info-fill.svg";
import { ReactComponent as ArrowUpIcon } from "../../assets/icons/arrow-up.svg";
import { ReactComponent as sLionTokenImg } from "../../assets/tokens/token_sLION.svg";
import { ReactComponent as wsLionTokenImg } from "../../assets/tokens/token_wsLION.svg";
import { ReactComponent as lionTokenImg } from "../../assets/tokens/token_LION.svg";
import { ReactComponent as t33TokenImg } from "../../assets/tokens/token_33T.svg";
import "./lionmenu.scss";
import { dai, frax } from "src/helpers/AllBonds";
import { Trans } from "@lingui/macro";
import Grid from "@material-ui/core/Grid";
import LionImg from "src/assets/tokens/token_LION.svg";
import SLionImg from "src/assets/tokens/token_sLION.svg";
import WsLionImg from "src/assets/tokens/token_wsLION.svg";
import token33tImg from "src/assets/tokens/token_33T.svg";
import { segmentUA } from "../../helpers/userAnalyticHelpers";
import { useSelector } from "react-redux";
import { useWeb3Context } from "../../hooks";

const addTokenToWallet = (tokenSymbol, tokenAddress, address) => async () => {
  if (window.ethereum) {
    const host = window.location.origin;
    let tokenPath;
    let tokenDecimals = TOKEN_DECIMALS;
    switch (tokenSymbol) {
      case "LION":
        tokenPath = LionImg;
        break;
      case "33T":
        tokenPath = token33tImg;
        break;
      case "gLION":
        tokenPath = WsLionImg;
        tokenDecimals = 18;
        break;
      default:
        tokenPath = SLionImg;
    }
    const imageURL = `${host}/${tokenPath}`;

    try {
      await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
            image: imageURL,
          },
        },
      });
      let uaData = {
        address: address,
        type: "Add Token",
        tokenName: tokenSymbol,
      };
      segmentUA(uaData);
    } catch (error) {
      console.log(error);
    }
  }
};

function LionMenu() {
  const [anchorEl, setAnchorEl] = useState(null);
  const isEthereumAPIAvailable = window.ethereum;
  const { address } = useWeb3Context();
  const networkId = useSelector(state => state.network.networkId);

  const SLION_ADDRESS = addresses[networkId] && addresses[networkId].SLION_ADDRESS;
  const LION_ADDRESS = addresses[networkId] && addresses[networkId].LION_ADDRESS;
  const PT_TOKEN_ADDRESS = addresses[networkId] && addresses[networkId].PT_TOKEN_ADDRESS;
  const GLION_ADDRESS = addresses[networkId] && addresses[networkId].GLION_ADDRESS;

  const handleClick = event => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const open = Boolean(anchorEl);
  const id = "lion-popper";
  const daiAddress = dai.getAddressForReserve(networkId);
  const fraxAddress = frax.getAddressForReserve(networkId);
  return (
    <Grid
      container
      component="div"
      onMouseEnter={e => handleClick(e)}
      onMouseLeave={e => handleClick(e)}
      id="lion-menu-button-hover"
    >
      <Button
        id="lion-menu-button"
        size="large"
        variant="contained"
        color="secondary"
        title="LION"
        aria-describedby={id}
      >
        <SvgIcon component={InfoIcon} color="primary" />
        <Typography className="lion-menu-button-text">LION</Typography>
      </Button>

      <Popper id={id} open={open} anchorEl={anchorEl} placement="bottom-start" transition>
        {({ TransitionProps }) => {
          return (
            <Fade {...TransitionProps} timeout={100}>
              <Paper className="lion-menu" elevation={1}>
                <Box component="div" className="buy-tokens">
                  <Link
                    href={`https://app.sushi.com/swap?inputCurrency=${daiAddress}&outputCurrency=${LION_ADDRESS}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button size="large" variant="contained" color="secondary" fullWidth>
                      <Typography align="left">
                        <Trans>Buy on {new String("Sushiswap")}</Trans>
                        <SvgIcon component={ArrowUpIcon} htmlColor="#A3A3A3" />
                      </Typography>
                    </Button>
                  </Link>

                  <Link
                    href={`https://app.uniswap.org/#/swap?inputCurrency=${fraxAddress}&outputCurrency=${LION_ADDRESS}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button size="large" variant="contained" color="secondary" fullWidth>
                      <Typography align="left">
                        <Trans>Buy on {new String("Uniswap")}</Trans>
                        <SvgIcon component={ArrowUpIcon} htmlColor="#A3A3A3" />
                      </Typography>
                    </Button>
                  </Link>

                  <Link component={NavLink} to="/wrap" style={{ textDecoration: "none" }}>
                    <Button size="large" variant="contained" color="secondary" fullWidth>
                      <Typography align="left">Wrap sLION</Typography>
                    </Button>
                  </Link>
                </Box>

                <Box component="div" className="data-links">
                  <Divider color="secondary" className="less-margin" />
                  <Link href={`https://dune.xyz/shadow/Lion-(LION)`} target="_blank" rel="noreferrer">
                    <Button size="large" variant="contained" color="secondary" fullWidth>
                      <Typography align="left">
                        Shadow's Dune Dashboard <SvgIcon component={ArrowUpIcon} htmlColor="#A3A3A3" />
                      </Typography>
                    </Button>
                  </Link>
                </Box>

                {isEthereumAPIAvailable ? (
                  <Box className="add-tokens">
                    <Divider color="secondary" />
                    <p>
                      <Trans>ADD TOKEN TO WALLET</Trans>
                    </p>
                    <Box display="flex" flexDirection="row" justifyContent="space-between">
                      {LION_ADDRESS && (
                        <Button
                          variant="contained"
                          color="secondary"
                          onClick={addTokenToWallet("LION", LION_ADDRESS, address)}
                        >
                          <SvgIcon
                            component={lionTokenImg}
                            viewBox="0 0 32 32"
                            style={{ height: "25px", width: "25px" }}
                          />
                          <Typography variant="body1">LION</Typography>
                        </Button>
                      )}
                      {SLION_ADDRESS && (
                        <Button
                          variant="contained"
                          color="secondary"
                          onClick={addTokenToWallet("sLION", SLION_ADDRESS, address)}
                        >
                          <SvgIcon
                            component={sLionTokenImg}
                            viewBox="0 0 100 100"
                            style={{ height: "25px", width: "25px" }}
                          />
                          <Typography variant="body1">sLION</Typography>
                        </Button>
                      )}
                      {GLION_ADDRESS && (
                        <Button
                          variant="contained"
                          color="secondary"
                          onClick={addTokenToWallet("gLION", GLION_ADDRESS, address)}
                        >
                          <SvgIcon
                            component={wsLionTokenImg}
                            viewBox="0 0 180 180"
                            style={{ height: "25px", width: "25px" }}
                          />
                          <Typography variant="body1">gLION</Typography>
                        </Button>
                      )}
                      {PT_TOKEN_ADDRESS && (
                        <Button
                          variant="contained"
                          color="secondary"
                          onClick={addTokenToWallet("33T", PT_TOKEN_ADDRESS, address)}
                        >
                          <SvgIcon
                            component={t33TokenImg}
                            viewBox="0 0 1000 1000"
                            style={{ height: "25px", width: "25px" }}
                          />
                          <Typography variant="body1">33T</Typography>
                        </Button>
                      )}
                    </Box>
                  </Box>
                ) : null}

                <Divider color="secondary" />
                <Link
                  href="https://docs.liondao.finance/using-the-website/unstaking_lp"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button size="large" variant="contained" color="secondary" fullWidth>
                    <Typography align="left">
                      <Trans>Unstake Legacy LP Token</Trans>
                    </Typography>
                  </Button>
                </Link>
                <Link
                  href="https://synapseprotocol.com/?inputCurrency=gLION&outputCurrency=gLION&outputChain=43114"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button size="large" variant="contained" color="secondary" fullWidth>
                    <Typography align="left">
                      <Trans>Bridge Tokens</Trans>
                    </Typography>
                  </Button>
                </Link>
              </Paper>
            </Fade>
          );
        }}
      </Popper>
    </Grid>
  );
}

export default LionMenu;
