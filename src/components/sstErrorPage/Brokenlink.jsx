import React from 'react';
import CommonError from '../CommonComponents/CommonError';
import BrokenlinkImage from '@/assets/SSTErrorsImage/Brokenlink.svg';


const Brokenlink = () => {
  return (
    <CommonError
      title="Oh no..a broken link"
      message="The page you were looking for seems to have gone missing."
      buttonText="Home"
      buttonLink="/"
      imageSrc={BrokenlinkImage}
      imageAlt="Brokenlink hourglass icon"
    />
  );
};

export default Brokenlink;