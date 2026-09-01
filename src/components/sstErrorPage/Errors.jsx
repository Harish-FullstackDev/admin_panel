import React from 'react';
import CommonError from '../CommonComponents/CommonError';
import ErrorsImage from '@/assets/SSTErrorsImage/Errors.svg';


const Errors = () => {
  return (
    <CommonError
      title="404  Error"
      message="The page you were looking for seems to have gone missing."
      buttonText="Home"
      buttonLink="/"
      imageSrc="/not-found-404.png"
      imageAlt="Not Found"
    />
  );
};

export default Errors;