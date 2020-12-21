import React, { FormEvent, useEffect, useState } from 'react';
import { Typography, makeStyles, TextField, Grid, Button, InputLabel, Theme } from '@material-ui/core';
import { useAppState } from '../../../state';
import { Settings } from '../../../state/settings/settingsReducer';
import { Steps } from '../PreJoinScreens';
// import { setTokenSourceMapRange } from 'typescript';

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
  setStep: (step: Steps) => void;
}

export default function RoomNameScreen({
  name,
  roomName,
  setName,
  setRoomName,
  handleSubmit,
  setStep,
}: RoomNameScreenProps) {
  const classes = useStyles();
  const { user, dispatchSetting, roomInfo } = useAppState();

  const [roomCreatedBy, setRoomCreatedBy] = useState('');
  const [roomValidFrom, setRoomValidFrom] = useState('');
  const [roomValidTo, setRoomValidTo] = useState('');
  const [roomError, setRoomError] = useState(false);
  const [roomNotReady, setRoomNotReady] = useState(false);
  const [roomExpired, setRoomExpired] = useState(false);

  useEffect(() => {
    if (roomInfo) {
      setRoomError(false);
      setRoomName(roomInfo.title);
      setRoomCreatedBy(roomInfo.user_name);

      let valid_from_obj = new Date(roomInfo.accessible_from);
      let valid_from_str = valid_from_obj.toString().split(' GMT')[0];
      setRoomValidFrom(valid_from_str);

      let valid_to_obj = new Date(roomInfo.accessible_to);
      let valid_to_str = valid_to_obj.toString().split(' GMT')[0];
      setRoomValidTo(valid_to_str);

      if (valid_from_obj.getTime() > Date.now()) {
        setRoomNotReady(true);
      }

      if (valid_to_obj.getTime() < Date.now()) {
        setRoomExpired(true);
      }

      dispatchSetting({ name: 'bandwidthProfileMode' as keyof Settings, value: roomInfo.mode as string });

      const userDisplayName = localStorage.getItem('userDisplayName');

      if (userDisplayName) {
        setName(userDisplayName);
        setStep(Steps.deviceSelectionStep);
      }
    } else {
      setRoomError(true);
    }
  }, [roomInfo]);

  const hasUsername = !window.location.search.includes('customIdentity=true') && user?.displayName;

  return (
    <>
      {!roomError && !roomNotReady && !roomExpired && (
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

      {roomError && (
        <>
          <Typography variant="h5" className={classes.gutterBottom}>
            The room is not accessible
          </Typography>
          <Typography variant="subtitle1">
            The room token is not valid. Please enter the valid room token and try again.
          </Typography>
        </>
      )}

      {roomExpired && (
        <>
          <Typography variant="h5" className={classes.gutterBottom}>
            Room expired
          </Typography>
          <Typography variant="subtitle1">
            Room {roomName} expired at {roomValidTo}
          </Typography>
        </>
      )}

      {roomNotReady && (
        <>
          <Typography variant="h5" className={classes.gutterBottom}>
            Room is not accessible yet
          </Typography>
          <Typography variant="subtitle1">
            Room {roomName} will be accessible at {roomValidFrom}
          </Typography>
        </>
      )}
    </>
  );
}
