import React from 'react'
import HomeCareer from './Header'
import AboutCareer from './AboutCareer'
import JobBoard from './Opportunities'
import CarrerFAQ from './CarrerFAQ'
import Whyjoinsst from './Whyjoinsst'
import Sectionsst from './Sectionsst'

const Career = () => {
  return (
    <div>
        <HomeCareer/>
        <Whyjoinsst/>
        <AboutCareer/>
        <JobBoard/>
        <Sectionsst/>
        <CarrerFAQ/>
     </div>
  )
}

export default Career