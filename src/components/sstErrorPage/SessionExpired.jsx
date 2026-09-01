import React from 'react';
import CommonError from '../CommonComponents/CommonError';
import SessionExpiredIcon from '@/assets/SSTErrorsImage/sessionexpireds.svg';


const SessionExpired = () => {
  return (
    <CommonError
      title="Session Expired"
      message="Your current session has been expired."
      buttonText="Home"
      buttonLink="/"
      imageSrc={SessionExpiredIcon}
      imageAlt="Session expired hourglass icon"
    />
  );
};

export default SessionExpired;