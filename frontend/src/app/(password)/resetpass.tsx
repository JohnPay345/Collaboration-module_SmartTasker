import React from 'react';
import { ResetPasswordScreen } from '@src/screens/ResetPasswrodScreen'

type ResetPassType = {
  screen: string;
}

export default function ResetPassList({screen = 'Login'}) {
  return <ResetPasswordScreen screen={screen} />;
};
