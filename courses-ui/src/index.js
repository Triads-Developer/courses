import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'
import { LicenseInfo } from '@mui/x-license'

LicenseInfo.setLicenseKey(
  '548de6cf4b4177412b06fd642b9e52c0Tz0xMzE5ODAsRT0xODIwMjc1MTk5MDAwLFM9cHJvLExNPWFubnVhbCxQVj1RMy0yMDI0LEtWPTI='
)

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
