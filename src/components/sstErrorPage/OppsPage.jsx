import React from 'react';
import CommonError from '../CommonComponents/CommonError';
import Oppsimage from '@/assets/SSTErrorsImage/OppsPage.svg';


const OppsPage = () => {
  return (
    <CommonError
      title="Opps! Something Went Wrong"
      message="You didn’t break the internet, but we can’t find what are you looking for."
      buttonText="Home"
      buttonLink="/"
      imageSrc={Oppsimage}
      imageAlt="Something Went Wrong hourglass icon"
    />
  );
};

export default OppsPage;