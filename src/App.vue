<template>
  <FinancialReportTreeTable />
</template>

<script>
import FinancialReportTreeTable from './components/FinancialReportTreeTable.vue'

export default {
  name: 'App',
  components: {
    FinancialReportTreeTable
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f7fa;
  min-height: 100vh;
}

body {
  margin: 0;
  padding: 0;
}
</style>
