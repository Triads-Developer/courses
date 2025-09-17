import React from 'react'
import './App.css'
import { DataGridPro } from '@mui/x-data-grid-pro'
import Box from '@mui/material/Box'

function ResultsGrid({ 
  rows, 
  loading, 
  error, 
  paginationModel, 
  onPaginationModelChange,
  rowCount,
  filterModel,
  onFilterModelChange,
  onRowClick,
  semestersOptionsLength = 0
}) {
  const baseColumns = [
    { field: 'Course Number', headerName: 'Course #', width: 100 },
    { field: 'Section', headerName: 'Section Info', width: 350 },
    { field: 'id', headerName: 'Course ID', width: 200 },
    { field: 'Program of Study', headerName: 'Program', flex: 1, minWidth: 150 },
    { field: 'Academic Requirement', headerName: 'Requirement', flex: 1, minWidth: 150 },
    { field: 'Program of Study Type', headerName: 'Requirement Type', flex: 1, minWidth: 150 },
    { 
      field: 'iqAttributes', 
      headerName: 'IQ Requirements', 
      width: 150,
      renderCell: (params) => {
        if (params.value && Array.isArray(params.value)) {
          return params.value.join(', ')
        }
        return ''
      }
    },
    { field: 'Days', headerName: 'Days', width: 100 },
    { field: 'Start Time', headerName: 'Start Time', width: 100 },
    { field: 'End Time', headerName: 'End Time', width: 100 }
  ]

  // Conditionally add Semester column if semester data exists
  const columns = semestersOptionsLength > 0 
    ? [...baseColumns, { field: 'Academic Period', headerName: 'Academic Period', width: 140 }]
    : baseColumns

  if (error) {
    return <Box sx={{ p: 2, color: 'error.main' }}>Error loading course data: {error}</Box>
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <>
      <Box sx={{ width: '100%' }}>
        <DataGridPro
          rows={rows}
          columns={columns}
          rowCount={rowCount}
          paginationModel={paginationModel}
          sortModel={[{ field: 'Section', sort: 'asc' }]}
          disableToolbarButton={true}
          onPaginationModelChange={onPaginationModelChange}
          filterModel={filterModel}
          onFilterModelChange={onFilterModelChange}
          paginationMode="server"
          //sortingMode="server"
          initialState={{
            sorting: {
              sortModel: [
                { field: 'Course Subject Abbreviation', sort: 'asc' },
                { field: 'Course Number', sort: 'asc' }
              ]
            }
          }}
          columnVisibilityModel={{
            id: false
          }}
          pagination
          disableRowSelectionOnClick
          onRowClick={onRowClick}
          pageSizeOptions={[10, 25, 50, 100, 500]}
          autoHeight
          disableColumnFilter={false}
          headerFilters={false}
          sx={{
            '& .MuiDataGrid-cell': {
              whiteSpace: 'normal',
              lineHeight: 'normal'
            }
          }}
          loading={loading}
          disableColumnMenu={false}
          disableMultipleColumnsFiltering={false}
          disableMultipleColumnsSorting={false}
        />
      </Box>
    </>
  )
}

export default ResultsGrid
