import Snackbar from "@material-ui/core/Snackbar";
import MuiAlert from "@material-ui/lab/Alert";
import Slide from "@material-ui/core/Slide";
import { makeStyles } from "@material-ui/core/styles";

function Alert(props) {
  return <MuiAlert elevation={6} variant="outlined" {...props} />;
}

const useStyles = makeStyles(theme => ({
  root: {
    width: "100%",
    "& > * + *": {
      marginTop: theme.spacing(2),
    },
  },
}));

function FanSnackbar({ message, duration, severity }) {
  const classes = useStyles();
  const [open, setOpen] = useState(true);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  return (
    <Slide direction="up">
      <div className={classes.root}>
        <Snackbar open={open} autoHideDuration={duration}>
          <Alert onClose={handleClose} severity={severity}>
            {message}
          </Alert>
        </Snackbar>
      </div>
    </Slide>
  );
}

export const fanToast = {
  success: message => {
    FanSnackbar(message, null, "success");
  },
  error: message => {
    FanSnackbar(message, null, "error");
  },
  info: message => {
    FanSnackbar(message, null, "info");
  },
  warn: message => {
    FanSnackbar(message, null, "warning");
  },
};
