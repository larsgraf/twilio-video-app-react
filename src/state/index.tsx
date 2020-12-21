import React, { createContext, useContext, useEffect, useReducer, useState } from 'react';
import { RoomType } from '../types';
import { TwilioError } from 'twilio-video';
import { settingsReducer, initialSettings, Settings, SettingsAction } from './settings/settingsReducer';
import useActiveSinkId from './useActiveSinkId/useActiveSinkId';
import useFirebaseAuth from './useFirebaseAuth/useFirebaseAuth';
import usePasscodeAuth from './usePasscodeAuth/usePasscodeAuth';
import { User } from 'firebase';
// import

export interface StateContextType {
  error: TwilioError | null;
  setError(error: TwilioError | null): void;
  getToken(name: string, room: string, passcode?: string): Promise<string>;
  user?: User | null | { displayName: undefined; photoURL: undefined; passcode?: string };
  signIn?(passcode?: string): Promise<void>;
  signOut?(): Promise<void>;
  isAuthReady?: boolean;
  isFetching: boolean;
  activeSinkId: string;
  setActiveSinkId(sinkId: string): void;
  settings: Settings;
  dispatchSetting: React.Dispatch<SettingsAction>;
  roomType?: RoomType;
  roomInfo?: {
    accessible_from: string;
    accessible_to: string;
    client_id: string;
    client_logo: boolean;
    client_name: string;
    mode: string;
    title: string;
    user_avatar: string;
    user_id: string;
    user_name: string;
  };
}

export const StateContext = createContext<StateContextType>(null!);

async function getRoomInfo() {
  const url_str = new URL(window.location.href);
  const room_id_token = url_str.searchParams.get('token');
  let origin = url_str.origin.indexOf('localhost') !== -1 ? 'http://localhost:3600' : url_str.origin;
  const api_endpoint = origin + '/api/confroom/?token=' + room_id_token;

  const response = await fetch(api_endpoint);
  return response.json();
}

/*
  The 'react-hooks/rules-of-hooks' linting rules prevent React Hooks fron being called
  inside of if() statements. This is because hooks must always be called in the same order
  every time a component is rendered. The 'react-hooks/rules-of-hooks' rule is disabled below
  because the "if (process.env.REACT_APP_SET_AUTH === 'firebase')" statements are evaluated
  at build time (not runtime). If the statement evaluates to false, then the code is not
  included in the bundle that is produced (due to tree-shaking). Thus, in this instance, it
  is ok to call hooks inside if() statements.
*/
export default function AppStateProvider(props: React.PropsWithChildren<{}>) {
  const [error, setError] = useState<TwilioError | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [activeSinkId, setActiveSinkId] = useActiveSinkId();
  const [settings, dispatchSetting] = useReducer(settingsReducer, initialSettings);
  const [roomInfo, setRoomInfo] = useState();

  useEffect(() => {
    getRoomInfo().then(data => {
      if (data.message === 'success') {
        setRoomInfo(data.data);
        document.getElementsByTagName('TITLE')[0].innerHTML = data.data.client_name + ' - Video Conference App';
      } else {
        setRoomInfo(undefined);
      }
    });
  }, []);

  let contextValue = {
    error,
    setError,
    isFetching,
    activeSinkId,
    setActiveSinkId,
    settings,
    dispatchSetting,
    roomInfo,
  } as StateContextType;

  if (process.env.REACT_APP_SET_AUTH === 'firebase') {
    contextValue = {
      ...contextValue,
      ...useFirebaseAuth(), // eslint-disable-line react-hooks/rules-of-hooks
    };
  } else if (process.env.REACT_APP_SET_AUTH === 'passcode') {
    contextValue = {
      ...contextValue,
      ...usePasscodeAuth(), // eslint-disable-line react-hooks/rules-of-hooks
    };
  } else {
    contextValue = {
      ...contextValue,
      getToken: async (identity, roomName) => {
        const headers = new window.Headers();
        const endpoint = process.env.REACT_APP_TOKEN_ENDPOINT || '/token';
        const params = new window.URLSearchParams({ identity, roomName });

        return fetch(`${endpoint}?${params}`, { headers }).then(res => res.text());
      },
    };
  }

  const getToken: StateContextType['getToken'] = (name, room) => {
    setIsFetching(true);
    return contextValue
      .getToken(name, room)
      .then(res => {
        setIsFetching(false);
        return res;
      })
      .catch(err => {
        setError(err);
        setIsFetching(false);
        return Promise.reject(err);
      });
  };

  return <StateContext.Provider value={{ ...contextValue, getToken }}>{props.children}</StateContext.Provider>;
}

export function useAppState() {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error('useAppState must be used within the AppStateProvider');
  }
  return context;
}
