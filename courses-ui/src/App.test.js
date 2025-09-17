import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import App from './App'

test('renders learn initial tutorial', () => {
  render(<App />)
  const linkElement = screen.getByText(/United Nations Framework/i)
  expect(linkElement).toBeInTheDocument()
})

test('renders the begin searching button', () => {
  render(<App />)
  const linkElement = screen.getByText(/BEGIN SEARCHING/i)
  expect(linkElement).toBeInTheDocument()
})

test('clicking on the button renders the filters to search for', () => {
  render(<App />)
  const beginButton = screen.getByText(/BEGIN SEARCHING/i)
  fireEvent.click(beginButton)

  const excelLink = screen.getByText(/associated on-site delegates-excel file/i)
  expect(excelLink).toBeInTheDocument()
})

test('clicking on the Badge Category drop down opens the different options', async () => {
  render(<App />)
  const beginButton = screen.getByText(/BEGIN SEARCHING/i)
  fireEvent.click(beginButton)

  const dropdown = screen.getAllByText(/Badge Category \*/i)
  fireEvent.click(dropdown[0])
  expect(dropdown[0]).toBeInTheDocument()
})
