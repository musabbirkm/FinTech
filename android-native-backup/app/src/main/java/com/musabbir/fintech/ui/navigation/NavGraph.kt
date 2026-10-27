package com.musabbir.fintech.ui.navigation

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.musabbir.fintech.domain.calculations.FinancialCalculations
import com.musabbir.fintech.domain.model.Currency
import com.musabbir.fintech.ui.components.AppFooter
import com.musabbir.fintech.ui.components.FinTechTopBar
import com.musabbir.fintech.ui.viewmodel.FinTechViewModel

sealed class Screen(val route: String, val title: String) {
    object Dashboard : Screen("dashboard", "Dashboard")
    object Expenses : Screen("expenses", "Expenses")
    object Income : Screen("income", "Income")
    object Debts : Screen("debts", "Debts")
    object Settings : Screen("settings", "Settings")
}

@Composable
fun FinTechNavGraph(viewModel: FinTechViewModel) {
    val navController = rememberNavController()
    val currentCurrency by viewModel.currentCurrency.collectAsState()
    var selectedItem by remember { mutableStateOf(0) }

    val navItems = listOf(
        Screen.Dashboard to Icons.Default.Home,
        Screen.Income to Icons.Default.TrendingUp,
        Screen.Expenses to Icons.Default.TrendingDown,
        Screen.Debts to Icons.Default.AccountBalance,
        Screen.Settings to Icons.Default.Settings
    )

    Scaffold(
        topBar = {
            FinTechTopBar(
                currentCurrency = currentCurrency,
                onCurrencyChanged = { viewModel.setCurrency(it) }
            )
        },
        bottomBar = {
            NavigationBar {
                navItems.forEachIndexed { index, (screen, icon) ->
                    NavigationBarItem(
                        icon = { Icon(icon, contentDescription = screen.title) },
                        label = { Text(screen.title) },
                        selected = selectedItem == index,
                        onClick = {
                            selectedItem = index
                            navController.navigate(screen.route) {
                                popUpTo(navController.graph.startDestinationId)
                                launchSingleTop = true
                            }
                        }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Dashboard.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.Dashboard.route) {
                DashboardScreen(viewModel = viewModel)
            }
            composable(Screen.Income.route) {
                IncomeScreen(viewModel = viewModel)
            }
            composable(Screen.Expenses.route) {
                ExpensesScreen(viewModel = viewModel)
            }
            composable(Screen.Debts.route) {
                DebtsScreen(viewModel = viewModel)
            }
            composable(Screen.Settings.route) {
                SettingsScreen(viewModel = viewModel)
            }
        }
    }
}

@Composable
fun DashboardScreen(viewModel: FinTechViewModel) {
    val currency by viewModel.currentCurrency.collectAsState()
    val incomes by viewModel.incomes.collectAsState()
    val expenses by viewModel.expenses.collectAsState()
    val debts by viewModel.debts.collectAsState()
    val repayments by viewModel.repayments.collectAsState()

    val totalIncome = incomes.sumOf { it.amountMinor }
    val totalExpense = expenses.sumOf { it.amountMinor }
    val netBalance = totalIncome - totalExpense

    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp)
    ) {
        Text(
            text = "Financial Overview (${currency.name})",
            style = MaterialTheme.typography.titleLarge
        )
        Spacer(modifier = Modifier.height(16.dp))

        // Total Income Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(text = "Total Income", style = MaterialTheme.typography.labelMedium)
                Text(
                    text = FinancialCalculations.formatMoney(totalIncome, currency),
                    style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
        Spacer(modifier = Modifier.height(8.dp))

        // Total Expenses Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(text = "Total Expenses", style = MaterialTheme.typography.labelMedium)
                Text(
                    text = FinancialCalculations.formatMoney(totalExpense, currency),
                    style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.error
                )
            }
        }
        Spacer(modifier = Modifier.height(8.dp))

        // Net Balance Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(text = "Net Balance", style = MaterialTheme.typography.labelMedium)
                Text(
                    text = FinancialCalculations.formatMoney(netBalance, currency),
                    style = MaterialTheme.typography.headlineMedium
                )
            }
        }

        // Developer footer naturally at the bottom of the scrollable content
        AppFooter()
    }
}

@Composable
fun IncomeScreen(viewModel: FinTechViewModel) {
    val currency by viewModel.currentCurrency.collectAsState()
    val incomes by viewModel.incomes.collectAsState()

    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        item {
            Text(text = "Income Stream ($currency)", style = MaterialTheme.typography.titleLarge)
            Spacer(modifier = Modifier.height(16.dp))
        }
        items(incomes) { income ->
            Card(
                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(text = income.source, style = MaterialTheme.typography.bodyLarge)
                        Text(text = income.date, style = MaterialTheme.typography.bodySmall)
                    }
                    Text(
                        text = "+${FinancialCalculations.formatMoney(income.amountMinor, currency)}",
                        color = MaterialTheme.colorScheme.primary,
                        style = MaterialTheme.typography.titleMedium
                    )
                }
            }
        }
        item {
            AppFooter()
        }
    }
}

@Composable
fun ExpensesScreen(viewModel: FinTechViewModel) {
    val currency by viewModel.currentCurrency.collectAsState()
    val expenses by viewModel.expenses.collectAsState()

    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        item {
            Text(text = "Expense History ($currency)", style = MaterialTheme.typography.titleLarge)
            Spacer(modifier = Modifier.height(16.dp))
        }
        items(expenses) { exp ->
            Card(
                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(text = exp.merchant, style = MaterialTheme.typography.bodyLarge)
                        Text(text = "${exp.reason} • ${exp.date}", style = MaterialTheme.typography.bodySmall)
                    }
                    Text(
                        text = "-${FinancialCalculations.formatMoney(exp.amountMinor, currency)}",
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.titleMedium
                    )
                }
            }
        }
        item {
            AppFooter()
        }
    }
}

@Composable
fun DebtsScreen(viewModel: FinTechViewModel) {
    val currency by viewModel.currentCurrency.collectAsState()
    val debts by viewModel.debts.collectAsState()
    val repayments by viewModel.repayments.collectAsState()

    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        item {
            Text(text = "Debts & Credits ($currency)", style = MaterialTheme.typography.titleLarge)
            Spacer(modifier = Modifier.height(16.dp))
        }
        items(debts) { debt ->
            val calc = FinancialCalculations.calculateOutstanding(debt, repayments)
            Card(
                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(text = "${debt.personName} (${debt.type.name})", style = MaterialTheme.typography.titleMedium)
                    Text(text = debt.reason, style = MaterialTheme.typography.bodySmall)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Remaining: ${FinancialCalculations.formatMoney(calc.outstandingAmountMinor, currency)}",
                        style = MaterialTheme.typography.bodyLarge
                    )
                    Text(
                        text = "Original: ${FinancialCalculations.formatMoney(debt.originalAmountMinor, currency)}",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        }
        item {
            AppFooter()
        }
    }
}

@Composable
fun SettingsScreen(viewModel: FinTechViewModel) {
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp)
    ) {
        Text(text = "Settings & About", style = MaterialTheme.typography.titleLarge)
        Spacer(modifier = Modifier.height(16.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(text = "About & Developer", style = MaterialTheme.typography.titleMedium)
                Spacer(modifier = Modifier.height(8.dp))
                Text(text = "Application Name: FinTech", style = MaterialTheme.typography.bodyMedium)
                Text(text = "Developer: Musabbir KM", style = MaterialTheme.typography.bodyMedium)
                Text(text = "Version: 1.0.0", style = MaterialTheme.typography.bodyMedium)
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "A personal finance management application for tracking income, expenses, budgets, debts, credits, repayments, and financial reports in AED and INR.",
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }

        AppFooter()
    }
}
