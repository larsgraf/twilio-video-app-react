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
import { Settings } from '../../../state/settings/settingsReducer';

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
let origin = url_str.origin.indexOf('localhost') !== -1 ? 'http://localhost:3600' : url_str.origin;
const api_endpoint = origin + '/api/confroom/?token=';
// const api_endpoint = 'https://rtc2.seeyoulink.com/api/confroom/?token=';

console.log(api_endpoint);

async function getRoomInfo(url: string) {
  const response = await fetch(url);
  return response.json();
}

export default function RoomNameScreen({ name, roomName, setName, setRoomName, handleSubmit }: RoomNameScreenProps) {
  const classes = useStyles();
  const { user, dispatchSetting } = useAppState();
  const [isLoading, setIsLoading] = useState(true);
  const [roomCreatedBy, setRoomCreatedBy] = useState('');
  const [roomValidFrom, setRoomValidFrom] = useState('');
  const [roomValidTo, setRoomValidTo] = useState('');
  const [roomError, setRoomError] = useState(false);
  const [roomNotReady, setRoomNotReady] = useState(false);
  const [roomExpired, setRoomExpired] = useState(false);

  useEffect(() => {
    if (room_id) {
      getRoomInfo(api_endpoint + room_id).then(info => {
        console.log(info);
        setIsLoading(false);
        if (info.message === 'success') {
          setRoomName(info.data.title);
          setRoomCreatedBy(info.data.user_name);

          let valid_from_obj = new Date(info.data.accessible_from);
          let valid_from_str = valid_from_obj.toString().split(' GMT')[0];
          setRoomValidFrom(valid_from_str);

          let valid_to_obj = new Date(info.data.accessible_to);
          let valid_to_str = valid_to_obj.toString().split(' GMT')[0];
          setRoomValidTo(valid_to_str);

          if (valid_from_obj.getTime() > Date.now()) {
            setRoomNotReady(true);
          }

          if (valid_to_obj.getTime() < Date.now()) {
            setRoomExpired(true);
          }

          dispatchSetting({ name: 'bandwidthProfileMode' as keyof Settings, value: info.data.mode as string });
        } else {
          setRoomError(true);
        }
      });
    } else {
      setRoomError(true);
      setIsLoading(false);
    }
  }, []);

  const hasUsername = !window.location.search.includes('customIdentity=true') && user?.displayName;

  return (
    <>
      {!roomError && !roomNotReady && !roomExpired && !isLoading && (
        <>
          <Typography variant="h5" className={classes.gutterBottom}>
            Join a Room
          </Typography>
          <Typography variant="subtitle1">Room name: {roomName}</Typography>
          <Typography variant="subtitle1">Created by: {roomCreatedBy}</Typography>
          <br></br>
          <Typography variant="body1">
            {hasUsername
              ? "Enter the name of a room you'd like to join."
              : 'Enter your name and press "Continue" to join the room.'}
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

      {roomError && !isLoading && (
        <>
          <Typography variant="h5" className={classes.gutterBottom}>
            The room is not accessible
          </Typography>
          <Typography variant="subtitle1">
            The room token is not valid. Please enter the valid room token and try again.
          </Typography>
        </>
      )}

      {roomExpired && !isLoading && (
        <>
          <Typography variant="h5" className={classes.gutterBottom}>
            Room expired
          </Typography>
          <Typography variant="subtitle1">
            Room {roomName} expired at {roomValidTo}
          </Typography>
        </>
      )}

      {roomNotReady && !isLoading && (
        <>
          <Typography variant="h5" className={classes.gutterBottom}>
            Room is not accessible yet
          </Typography>
          <Typography variant="subtitle1">
            Room {roomName} will be accessible at {roomValidFrom}
          </Typography>
        </>
      )}

      {isLoading && !isLoading && (
        <>
          <Box justifyContent="center" width="100%" height="100%" display="flex" alignItems="center">
            <CircularProgress />
          </Box>
        </>
      )}
    </>
  );
}
