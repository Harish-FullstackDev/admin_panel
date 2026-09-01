import React from 'react';
import CommonHeader from '../CommonComponents/CommonHeader';

const Header = () => {
  return (
    <div>
      <CommonHeader 
        Title="Summary of our "
        TitleColor="Privacy Policy" 
        description="It covers every Zoho website that links here, and all of the products and services contained on those websites. 
        The detailed policy follows the same structure as this summary and constitutes the actual legal document.
        Our privacy commitment: Zoho has never sold your information to someone else for advertising, or made money by showing you 
        other people's ads, and we never will. This has been our approach for almost 25 years, and we remain committed to it.
         This policy tells you what information we collect from you, what we do with it, who can access it, 
         and what you can do about it"
      />
    </div>
  );
};

export default Header;