import React, { FormEvent, useEffect, useState } from 'react';
import {
  Typography,
  makeStyles,
  TextField,
  Grid,
  Button,
  InputLabel,
  Theme,
  CircularProgress,
  Box,
} from '@material-ui/core';
import { useAppState } from '../../../state';

const useStyles = makeStyles((theme: Theme) => ({
  gutterBottom: {
    marginBottom: '1em',
  },
  inputContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    margin: '1.5em 0 3.5em',
    '& div:not(:last-child)': {
      marginRight: '1em',
    },
    [theme.breakpoints.down('sm')]: {
      margin: '1.5em 0 2em',
    },
  },
  textFieldContainer: {
    width: '100%',
  },
  continueButton: {
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
  },
}));

interface RoomNameScreenProps {
  name: string;
  roomName: string;
  setName: (name: string) => void;
  setRoomName: (roomName: string) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

const url_str = new URL(window.location.href);
const room_id = url_str.searchParams.get('token');
const api_endpoint = 'https://rtc2.seeyoulink.com/api/confroom/?token=';
// 7e4819167463bba5a2beacd6bb437033d5cbec4bf393e521449fbf5d52f6c57b

async function getRoomInfo(url: string) {
  const response = await fetch(url);
  return response.json();
}

export default function RoomNameScreen({ name, roomName, setName, setRoomName, handleSubmit }: RoomNameScreenProps) {
  const classes = useStyles();
  const { user } = useAppState();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (room_id) {
      getRoomInfo(api_endpoint + room_id).then(info => {
        console.log(info);
        setIsLoading(false);
        if (info.message === 'success') {
          setRoomName(info.data.title);
        } else {
          setRoomName('');
        }
      });
    } else {
      setRoomName('');
      setIsLoading(false);
    }
  }, []);

  const hasUsername = !window.location.search.includes('customIdentity=true') && user?.displayName;

  function ErrorInfo() {
    return (
      <>
        <Typography variant="h5" className={classes.gutterBottom}>
          Invalid conference room
        </Typography>
        <Typography variant="body1">We can't access this room. Either room is invalid or expired.</Typography>
      </>
    );
  }

  return (
    <>
      {roomName && (
        <>
          <Typography variant="h5" className={classes.gutterBottom}>
            Join a Room: {roomName}
          </Typography>
          <Typography variant="body1">
            {hasUsername
              ? "Enter the name of a room you'd like to join."
              : "Enter your name and the name of a room you'd like to join"}
          </Typography>
          <form onSubmit={handleSubmit}>
            <div className={classes.inputContainer}>
              {!hasUsername && (
                <div className={classes.textFieldContainer}>
                  <InputLabel shrink htmlFor="input-user-name">
                    Your Name
                  </InputLabel>
                  <TextField
                    id="input-user-name"
                    variant="outlined"
                    fullWidth
                    size="small"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
              )}
            </div>
            <Grid container justify="flex-end">
              <Button
                variant="contained"
                type="submit"
                color="primary"
                disabled={!name /*|| !roomName*/}
                className={classes.continueButton}
              >
                Continue
              </Button>
            </Grid>
          </form>
        </>
      )}

      {!roomName && !isLoading && (
        <>
          <ErrorInfo />
        </>
      )}

      {isLoading && (
        <>
          <Box justifyContent="center" width="100%" height="100%" display="flex" alignItems="center">
            <CircularProgress />
          </Box>
        </>
      )}
    </>
  );
}
