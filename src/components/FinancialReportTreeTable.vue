<template>
  <div class="financial-report-container">
    <div class="card">
      <h2>Financial Report</h2>
      
      <!-- Search Filter -->
      <div class="search-container">
        <IconField>
          <InputIcon>
            <i class="pi pi-search" />
          </InputIcon>
          <InputText 
            v-model="globalFilterValue" 
            placeholder="Search line items..." 
            class="search-input"
          />
        </IconField>
      </div>

      <TreeTable
        v-model:expandedKeys="expandedKeys"
        :value="nodes"
      >
        <!-- Line Items Column -->
        <Column 
          field="name" 
          header="Line Items" 
          expander
        >
          <template #body="slotProps">
            {{ slotProps.node.data.name }}
          </template>
        </Column>

        <!-- Dynamic Period Columns -->
        <Column 
          v-for="period in periods" 
          :key="period.key"
          :field="period.key"
          :header="period.label"
        >
          <template #body="slotProps">
            {{ slotProps.node.data[period.key] }}
          </template>
        </Column>

        <!-- Empty State -->
        <template #empty>
          <div class="empty-message">
            No financial data found. Nodes length: {{ nodes.length }}
          </div>
        </template>

        <!-- Footer for debugging -->
        <template #footer>
          <div>Total Records: {{ nodes.length }}</div>
        </template>
      </TreeTable>

      <!-- Selection Info -->
      <div v-if="selectedCells.size > 0" class="selection-info">
        <Tag severity="info">
          {{ selectedCells.size }} cell(s) selected
        </Tag>
        <Button 
          label="Clear Selection" 
          icon="pi pi-times" 
          size="small"
          text
          @click="clearCellSelection"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted } from 'vue'
import TreeTable from 'primevue/treetable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

export default {
  name: 'FinancialReportTreeTable',
  components: {
    TreeTable,
    Column,
    InputText,
    IconField,
    InputIcon,
    Button,
    Tag
  },
  setup() {
    const nodes = ref([])
    const expandedKeys = ref({})
    const selectedKeys = ref({})
    const globalFilterValue = ref('')
    const draggedNode = ref(null)
    const selectedCells = ref(new Set())

    // Define periods (columns)
    const periods = ref([
      { key: 'q1_2024', label: 'Q1 2024' },
      { key: 'q2_2024', label: 'Q2 2024' },
      { key: 'q3_2024', label: 'Q3 2024' },
      { key: 'q4_2024', label: 'Q4 2024' },
      { key: 'fy_2024', label: 'FY 2024' }
    ])

    // Filters
    const filters = ref({
      global: { value: null, matchMode: 'contains' }
    })

    // Watch global filter
    watch(globalFilterValue, (newValue) => {
      filters.value.global.value = newValue
    })

    // Sample financial data structure
    const initializeData = () => {
      const data = [
        {
          key: '0',
          data: {
            name: 'Revenue',
            q1_2024: 1250000,
            q2_2024: 1380000,
            q3_2024: 1420000,
            q4_2024: 1550000,
            fy_2024: 5600000
          },
          children: [
            {
              key: '0-0',
              data: {
                name: 'Product Sales',
                q1_2024: 850000,
                q2_2024: 920000,
                q3_2024: 950000,
                q4_2024: 1050000,
                fy_2024: 3770000
              }
            },
            {
              key: '0-1',
              data: {
                name: 'Service Revenue',
                q1_2024: 400000,
                q2_2024: 460000,
                q3_2024: 470000,
                q4_2024: 500000,
                fy_2024: 1830000
              }
            }
          ]
        },
        {
          key: '1',
          data: {
            name: 'Operating Expenses',
            q1_2024: -750000,
            q2_2024: -780000,
            q3_2024: -810000,
            q4_2024: -840000,
            fy_2024: -3180000
          },
          children: [
            {
              key: '1-0',
              data: {
                name: 'Salaries & Wages',
                q1_2024: -450000,
                q2_2024: -460000,
                q3_2024: -470000,
                q4_2024: -480000,
                fy_2024: -1860000
              }
            },
            {
              key: '1-1',
              data: {
                name: 'Marketing',
                q1_2024: -150000,
                q2_2024: -160000,
                q3_2024: -170000,
                q4_2024: -180000,
                fy_2024: -660000
              }
            },
            {
              key: '1-2',
              data: {
                name: 'R&D',
                q1_2024: -150000,
                q2_2024: -160000,
                q3_2024: -170000,
                q4_2024: -180000,
                fy_2024: -660000
              }
            }
          ]
        },
        {
          key: '2',
          data: {
            name: 'Net Income',
            q1_2024: 500000,
            q2_2024: 600000,
            q3_2024: 610000,
            q4_2024: 710000,
            fy_2024: 2420000
          }
        },
        {
          key: '3',
          data: {
            name: 'Assets',
            q1_2024: 5000000,
            q2_2024: 5200000,
            q3_2024: 5400000,
            q4_2024: 5600000,
            fy_2024: 5600000
          },
          children: [
            {
              key: '3-0',
              data: {
                name: 'Current Assets',
                q1_2024: 2000000,
                q2_2024: 2100000,
                q3_2024: 2200000,
                q4_2024: 2300000,
                fy_2024: 2300000
              },
              children: [
                {
                  key: '3-0-0',
                  data: {
                    name: 'Cash & Equivalents',
                    q1_2024: 800000,
                    q2_2024: 900000,
                    q3_2024: 950000,
                    q4_2024: 1000000,
                    fy_2024: 1000000
                  }
                },
                {
                  key: '3-0-1',
                  data: {
                    name: 'Accounts Receivable',
                    q1_2024: 1200000,
                    q2_2024: 1200000,
                    q3_2024: 1250000,
                    q4_2024: 1300000,
                    fy_2024: 1300000
                  }
                }
              ]
            },
            {
              key: '3-1',
              data: {
                name: 'Fixed Assets',
                q1_2024: 3000000,
                q2_2024: 3100000,
                q3_2024: 3200000,
                q4_2024: 3300000,
                fy_2024: 3300000
              }
            }
          ]
        }
      ]

      nodes.value = data
      console.log('Nodes assigned:', nodes.value)

      // Expand all nodes by default
      expandAllNodes()
    }

    const expandAllNodes = () => {
      const expand = (nodes) => {
        nodes.forEach(node => {
          expandedKeys.value[node.key] = true
          if (node.children && node.children.length) {
            expand(node.children)
          }
        })
      }
      expand(nodes.value)
    }

    // Format currency
    const formatCurrency = (value) => {
      if (value === null || value === undefined) return '-'
      const absValue = Math.abs(value)
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(absValue)
      
      return value < 0 ? `(${formatted})` : formatted
    }

    // Drag and Drop handlers
    const onDragStart = (event, node) => {
      draggedNode.value = node
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/html', event.target)
      event.target.style.opacity = '0.5'
    }

    const onDragEnter = (event, node) => {
      if (draggedNode.value && draggedNode.value.key !== node.key) {
        event.target.closest('.draggable-row').classList.add('drag-over')
      }
    }

    const onDragLeave = (event) => {
      event.target.closest('.draggable-row')?.classList.remove('drag-over')
    }

    const onDrop = (event, targetNode) => {
      event.target.closest('.draggable-row')?.classList.remove('drag-over')
      
      if (draggedNode.value && draggedNode.value.key !== targetNode.key) {
        // Find and remove dragged node from tree
        const removeNode = (nodes, key) => {
          for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].key === key) {
              return nodes.splice(i, 1)[0]
            }
            if (nodes[i].children) {
              const found = removeNode(nodes[i].children, key)
              if (found) return found
            }
          }
          return null
        }

        // Find target node's parent and insert
        const insertNode = (nodes, targetKey, nodeToInsert) => {
          for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].key === targetKey) {
              nodes.splice(i + 1, 0, nodeToInsert)
              return true
            }
            if (nodes[i].children) {
              if (insertNode(nodes[i].children, targetKey, nodeToInsert)) {
                return true
              }
            }
          }
          return false
        }

        const movedNode = removeNode(nodes.value, draggedNode.value.key)
        if (movedNode) {
          insertNode(nodes.value, targetNode.key, movedNode)
          nodes.value = [...nodes.value] // Trigger reactivity
        }
      }
      
      draggedNode.value = null
      event.target.style.opacity = '1'
    }

    // Cell selection handlers
    const toggleCellSelection = (event, nodeKey, periodKey) => {
      const cellId = `${nodeKey}-${periodKey}`
      
      if (event.ctrlKey || event.metaKey) {
        // Multi-select with Ctrl/Cmd
        if (selectedCells.value.has(cellId)) {
          selectedCells.value.delete(cellId)
        } else {
          selectedCells.value.add(cellId)
        }
      } else if (event.shiftKey && selectedCells.value.size > 0) {
        // Range select with Shift (simplified - just add to selection)
        selectedCells.value.add(cellId)
      } else {
        // Single select
        selectedCells.value.clear()
        selectedCells.value.add(cellId)
      }
      
      // Force reactivity
      selectedCells.value = new Set(selectedCells.value)
    }

    const isCellSelected = (nodeKey, periodKey) => {
      return selectedCells.value.has(`${nodeKey}-${periodKey}`)
    }

    const clearCellSelection = () => {
      selectedCells.value.clear()
      selectedCells.value = new Set()
    }

    // Node selection handlers
    const onNodeSelect = (node) => {
      console.log('Node selected:', node)
    }

    const onNodeUnselect = (node) => {
      console.log('Node unselected:', node)
    }

    onMounted(() => {
      console.log('Component mounted, initializing data...')
      initializeData()
      console.log('Data initialized:', nodes.value)
      console.log('Number of root nodes:', nodes.value.length)
    })

    return {
      nodes,
      expandedKeys,
      selectedKeys,
      periods,
      filters,
      globalFilterValue,
      formatCurrency,
      onDragStart,
      onDragEnter,
      onDragLeave,
      onDrop,
      toggleCellSelection,
      isCellSelected,
      clearCellSelection,
      selectedCells,
      onNodeSelect,
      onNodeUnselect
    }
  }
}
</script>

<style scoped>
.financial-report-container {
  padding: 2rem;
  max-width: 100%;
  margin: 0 auto;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #333;
  font-size: 1.75rem;
}

.search-container {
  margin-bottom: 1.5rem;
}

.search-input {
  width: 100%;
  max-width: 400px;
}

.draggable-row {
  display: flex;
  align-items: center;
  cursor: move;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.draggable-row:hover {
  background-color: #f5f5f5;
}

.draggable-row.drag-over {
  background-color: #e3f2fd;
  border: 2px dashed #2196F3;
}

.drag-handle {
  color: #999;
  cursor: grab;
  margin-right: 0.5rem;
}

.drag-handle:active {
  cursor: grabbing;
}

.cell-value {
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
  user-select: none;
}

.cell-value:hover {
  background-color: #f5f5f5;
}

.cell-value.selected-cell {
  background-color: #bbdefb;
  border: 2px solid #2196F3;
}

.empty-cell {
  color: #999;
}

.empty-message {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.selection-info {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.ml-2 {
  margin-left: 0.5rem;
}

/* Override PrimeVue styles for better financial report look */
:deep(.p-treetable) {
  font-size: 0.9rem;
}

:deep(.p-treetable .p-treetable-tbody > tr) {
  height: 40px;
}

:deep(.p-treetable .p-treetable-tbody > tr > td) {
  padding: 0.75rem;
  border: 1px solid #dee2e6;
}

:deep(.p-treetable-thead > tr > th) {
  background-color: #f8f9fa;
  color: #495057;
  font-weight: 600;
  border: 1px solid #dee2e6;
  padding: 0.75rem;
}

:deep(.p-treetable-tbody > tr > td) {
  border: 1px solid #dee2e6;
}

:deep(.p-treetable-tbody > tr:hover) {
  background-color: #f8f9fa;
}

:deep(.p-treetable .p-treetable-frozen-column) {
  background-color: #fafafa;
  font-weight: 500;
}
</style>
