import React from 'react'
import PropTypes from 'prop-types'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'

function Tutorial({ handleDismissTutorial }) {
  return (
    <>
      <div className='tutorial-box'>
        <h2>Welcome to Washington University in St. Louis&apos; searchable UNFCCC COP FLOP database.</h2>
        <p>
          This site will allow you to view, query and export data from the UNFCCC COP 29 Final List of Participants data set (FLOP data) for
          on-site delegates.
        </p>
        <p>
          The underlying data can be found on the{' '}
          <Link href='https://unfccc.int/documents/644763'>United Nations Framework Convention on Climate Change (UNFCCC) website.</Link>{' '}
        </p>
        <p>
          This is a work in progress, and we hope it is helpful to you in your research and helps provide transparency of COP attendance.
          Let us know{' '}
          <Link hrf='https://docs.google.com/forms/d/e/1FAIpQLSdo2VOtnncR_F0PIWuHiKA4XdKa1Syq9N38jDZk7gu9bIR_ow/viewform'>
            how you are using the data and if you have any suggestions for improvement by completing this form.
          </Link>
        </p>

        <Button variant='text' id='tutorial-button' onClick={handleDismissTutorial}>
          Begin searching
        </Button>
      </div>
    </>
  )
}

Tutorial.propTypes = {
  handleDismissTutorial: PropTypes.func
}

export default Tutorial
