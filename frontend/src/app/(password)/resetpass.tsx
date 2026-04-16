import React from 'react';
import { ResetPasswordScreen } from '@src/screens/ResetPasswrodScreen'

type ResetPassType = {
  screen: string;
}

export const ResetPassList: React.FC<ResetPassType> = ({screen = 'Login'}) => {
  return (
    <ResetPasswordScreen screen={screen} />
  );
};
