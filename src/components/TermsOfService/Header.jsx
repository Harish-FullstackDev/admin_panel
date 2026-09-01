import React from 'react';
import CommonHeader from '../CommonComponents/CommonHeader';

const Header = () => {
  return (
    <div>
      <CommonHeader 
        Title="Terms of "
        TitleColor="Service" 
        description="We provide cloud software and applications for businesses, including associated offline and mobile applications.
         You may use the Services for your personal and business use or for internal business purpose in the organization that you represent.
          You may connect to the Services using any Internet browser supported by the Services. You are responsible for obtaining
           access to the Internet and the equipment necessary to use the Services. You can create and edit content with your user account 
           and if you choose to do so, you can publish and share such content."
      />
    </div>
  );
};

export default Header;