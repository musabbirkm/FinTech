package com.musabbir.fintech.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.musabbir.fintech.data.repository.FinTechRepository
import com.musabbir.fintech.domain.calculations.FinancialCalculations
import com.musabbir.fintech.domain.model.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class FinTechViewModel(
    private val repository: FinTechRepository
) : ViewModel() {

    private val _currentCurrency = MutableStateFlow(Currency.AED)
    val currentCurrency: StateFlow<Currency> = _currentCurrency.asStateFlow()

    private val _currentTimePeriod = MutableStateFlow(TimePeriod.THIS_MONTH)
    val currentTimePeriod: StateFlow<TimePeriod> = _currentTimePeriod.asStateFlow()

    val categories: StateFlow<List<Category>> = _currentCurrency
        .flatMapLatest { currency -> repository.getCategories(currency) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val incomes: StateFlow<List<Income>> = _currentCurrency
        .flatMapLatest { currency -> repository.getIncomes(currency) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val expenses: StateFlow<List<Expense>> = _currentCurrency
        .flatMapLatest { currency -> repository.getExpenses(currency) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val debts: StateFlow<List<Debt>> = _currentCurrency
        .flatMapLatest { currency -> repository.getDebts(currency) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val repayments: StateFlow<List<Repayment>> = _currentCurrency
        .flatMapLatest { currency -> repository.getRepayments(currency) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val reminders: StateFlow<List<Reminder>> = _currentCurrency
        .flatMapLatest { currency -> repository.getReminders(currency) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val savingsGoals: StateFlow<List<SavingsGoal>> = _currentCurrency
        .flatMapLatest { currency -> repository.getSavingsGoals(currency) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun setCurrency(currency: Currency) {
        _currentCurrency.value = currency
    }

    fun setTimePeriod(period: TimePeriod) {
        _currentTimePeriod.value = period
    }

    // Category CRUD
    fun addCategory(name: String, icon: String, color: String, budgetMinor: Long?) {
        viewModelScope.launch {
            val curr = _currentCurrency.value
            val id = "cat_custom_${curr.name.lowercase()}_${System.currentTimeMillis()}"
            repository.addCategory(
                Category(
                    id = id,
                    name = name,
                    currency = curr,
                    icon = icon,
                    color = color,
                    monthlyBudgetMinor = budgetMinor,
                    isCustom = true
                )
            )
        }
    }

    fun deleteCategory(id: String, reassignToId: String?) {
        viewModelScope.launch {
            repository.deleteCategory(id, reassignToId)
        }
    }

    // Income CRUD
    fun addIncome(amountStr: String, source: String, paymentMethod: PaymentMethod, date: String) {
        viewModelScope.launch {
            val curr = _currentCurrency.value
            val minor = FinancialCalculations.toMinorUnits(amountStr, curr)
            val id = "inc_${System.currentTimeMillis()}"
            repository.addIncome(
                Income(
                    id = id,
                    date = date,
                    amountMinor = minor,
                    currency = curr,
                    source = source,
                    paymentMethod = paymentMethod
                )
            )
        }
    }

    fun deleteIncome(id: String) {
        viewModelScope.launch { repository.deleteIncome(id) }
    }

    // Expense CRUD
    fun addExpense(amountStr: String, categoryId: String, merchant: String, reason: String, date: String, paymentMethod: PaymentMethod) {
        viewModelScope.launch {
            val curr = _currentCurrency.value
            val minor = FinancialCalculations.toMinorUnits(amountStr, curr)
            val id = "exp_${System.currentTimeMillis()}"
            repository.addExpense(
                Expense(
                    id = id,
                    date = date,
                    amountMinor = minor,
                    categoryId = categoryId,
                    currency = curr,
                    merchant = merchant,
                    reason = reason,
                    paymentMethod = paymentMethod
                )
            )
        }
    }

    fun deleteExpense(id: String) {
        viewModelScope.launch { repository.deleteExpense(id) }
    }

    // Debt CRUD & Repayment
    fun addDebt(type: DebtType, person: String, amountStr: String, date: String, reason: String) {
        viewModelScope.launch {
            val curr = _currentCurrency.value
            val minor = FinancialCalculations.toMinorUnits(amountStr, curr)
            val id = "debt_${System.currentTimeMillis()}"
            repository.addDebt(
                Debt(
                    id = id,
                    type = type,
                    personName = person,
                    originalAmountMinor = minor,
                    currency = curr,
                    startDate = date,
                    reason = reason
                )
            )
        }
    }

    fun addRepayment(debtId: String, amountStr: String, date: String, method: PaymentMethod) {
        viewModelScope.launch {
            val curr = _currentCurrency.value
            val minor = FinancialCalculations.toMinorUnits(amountStr, curr)
            val id = "rep_${System.currentTimeMillis()}"
            repository.addRepayment(
                Repayment(
                    id = id,
                    debtId = debtId,
                    date = date,
                    amountMinor = minor,
                    currency = curr,
                    paymentMethod = method
                )
            )
        }
    }

    fun deleteDebt(id: String) {
        viewModelScope.launch { repository.deleteDebt(id) }
    }
}
