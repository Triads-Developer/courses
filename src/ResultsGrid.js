import React from 'react'
import './App.css'
import { DataGridPro, GridToolbarContainer, GridToolbarExport } from '@mui/x-data-grid-pro'
import Box from '@mui/material/Box'
import PropTypes from 'prop-types'
import * as Constants from './constants.js'

function ResultsGrid({ results }) {
  const columns = [
    { field: 'id', headerName: 'ID', minWidth: 10 },
    { field: 'Nominated by', headerName: 'Nominated By', flex: 1, minWidth: 125 },
    { field: 'Name', headerName: 'Name', flex: 1, minWidth: 125 },
    { field: 'Functional title', headerName: 'Functional Title', flex: 1, minWidth: 125 },
    { field: 'Department', headerName: 'Department', flex: 1, minWidth: 125 },
    { field: 'Home organization', headerName: 'Home Organization', flex: 1, minWidth: 125 },
    { field: 'Badge Category', headerName: 'Badge Category', flex: 1, minWidth: 125 },
    {
      field: 'Relation',
      headerName: 'Relation',
      minWidth: 125,
      flex: 1,
      valueGetter: (value, row) => {
        if (Constants.relationOptions.indexOf(row.Relation) === -1) {
          return 'Other (please specify)'
        } else {
          return row.Relation
        }
      }
    },
    {
      field: 'Specify',
      headerName: 'Specify',
      minWidth: 125,
      flex: 1,
      valueGetter: (value, row) => {
        if (Constants.relationOptions.indexOf(row.Relation) === -1) {
          return row.Relation
        } else {
          return ''
        }
      }
    }
  ]

  function CustomToolbar() {
    return (
      <GridToolbarContainer>
        <GridToolbarExport />
      </GridToolbarContainer>
    )
  }

  return (
    <>
      <Box sx={{ width: '100%' }}>
        {results.length > 0 ? (
          <DataGridPro
            rows={results}
            columns={columns}
            initialState={{
              pagination: { paginationModel: { page: 0, pageSize: 10 } }
            }}
            columnVisibilityModel={{
              id: false
            }}
            pagination
            checkboxSelection
            pageSizeOptions={[5, 10, 25, 50, 100]}
            autoHeight
            disableColumnFilter
            headerFilters
            slots={{ toolbar: CustomToolbar }}
          />
        ) : null}
      </Box>
    </>
  )
}

ResultsGrid.propTypes = {
  results: PropTypes.array
}

export default ResultsGrid
