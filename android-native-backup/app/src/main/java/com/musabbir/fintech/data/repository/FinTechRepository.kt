package com.musabbir.fintech.data.repository

import com.musabbir.fintech.data.local.dao.FinTechDao
import com.musabbir.fintech.data.local.entity.*
import com.musabbir.fintech.domain.model.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class FinTechRepository(private val dao: FinTechDao) {

    fun getCategories(currency: Currency): Flow<List<Category>> {
        return dao.getActiveCategories(currency.name).map { list ->
            list.map { it.toDomain() }
        }
    }

    suspend fun addCategory(category: Category) {
        dao.insertCategory(category.toEntity())
    }

    suspend fun updateCategory(category: Category) {
        dao.updateCategory(category.toEntity())
    }

    suspend fun deleteCategory(id: String, reassignToId: String? = null) {
        if (reassignToId != null) {
            dao.reassignExpensesCategory(id, reassignToId)
        }
        dao.deleteCategory(id)
    }

    fun getIncomes(currency: Currency): Flow<List<Income>> {
        return dao.getIncomesByCurrency(currency.name).map { list ->
            list.map { it.toDomain() }
        }
    }

    suspend fun addIncome(income: Income) {
        dao.insertIncome(income.toEntity())
    }

    suspend fun deleteIncome(id: String) {
        dao.deleteIncome(id)
    }

    fun getExpenses(currency: Currency): Flow<List<Expense>> {
        return dao.getExpensesByCurrency(currency.name).map { list ->
            list.map { it.toDomain() }
        }
    }

    suspend fun addExpense(expense: Expense) {
        dao.insertExpense(expense.toEntity())
    }

    suspend fun deleteExpense(id: String) {
        dao.deleteExpense(id)
    }

    fun getDebts(currency: Currency): Flow<List<Debt>> {
        return dao.getDebtsByCurrency(currency.name).map { list ->
            list.map { it.toDomain() }
        }
    }

    suspend fun addDebt(debt: Debt) {
        dao.insertDebt(debt.toEntity())
    }

    suspend fun updateDebt(debt: Debt) {
        dao.updateDebt(debt.toEntity())
    }

    suspend fun deleteDebt(id: String) {
        dao.deleteDebt(id)
        dao.deleteRepaymentsForDebt(id)
    }

    fun getRepayments(currency: Currency): Flow<List<Repayment>> {
        return dao.getRepaymentsByCurrency(currency.name).map { list ->
            list.map { it.toDomain() }
        }
    }

    suspend fun addRepayment(repayment: Repayment) {
        dao.insertRepayment(repayment.toEntity())
    }

    suspend fun deleteRepayment(id: String) {
        dao.deleteRepayment(id)
    }

    fun getReminders(currency: Currency): Flow<List<Reminder>> {
        return dao.getRemindersByCurrency(currency.name).map { list ->
            list.map { it.toDomain() }
        }
    }

    suspend fun addReminder(reminder: Reminder) {
        dao.insertReminder(reminder.toEntity())
    }

    suspend fun updateReminder(reminder: Reminder) {
        dao.updateReminder(reminder.toEntity())
    }

    suspend fun deleteReminder(id: String) {
        dao.deleteReminder(id)
    }

    fun getSavingsGoals(currency: Currency): Flow<List<SavingsGoal>> {
        return dao.getSavingsGoalsByCurrency(currency.name).map { list ->
            list.map { it.toDomain() }
        }
    }

    suspend fun addSavingsGoal(goal: SavingsGoal) {
        dao.insertSavingsGoal(goal.toEntity())
    }

    suspend fun updateSavingsGoal(goal: SavingsGoal) {
        dao.updateSavingsGoal(goal.toEntity())
    }

    suspend fun deleteSavingsGoal(id: String) {
        dao.deleteSavingsGoal(id)
    }
}

// Mappings
private fun CategoryEntity.toDomain() = Category(
    id = id,
    name = name,
    currency = Currency.valueOf(currency),
    icon = icon,
    color = color,
    description = description,
    monthlyBudgetMinor = monthlyBudgetMinor,
    isCustom = isCustom,
    isArchived = isArchived,
    createdAt = createdAt,
    updatedAt = updatedAt
)

private fun Category.toEntity() = CategoryEntity(
    id = id,
    name = name,
    currency = currency.name,
    icon = icon,
    color = color,
    description = description,
    monthlyBudgetMinor = monthlyBudgetMinor,
    isCustom = isCustom,
    isArchived = isArchived,
    createdAt = createdAt,
    updatedAt = updatedAt
)

private fun IncomeEntity.toDomain() = Income(
    id = id,
    date = date,
    amountMinor = amountMinor,
    currency = Currency.valueOf(currency),
    source = source,
    paymentMethod = PaymentMethod.valueOf(paymentMethod),
    description = description,
    tags = if (tags.isNotBlank()) tags.split(",") else emptyList(),
    createdAt = createdAt
)

private fun Income.toEntity() = IncomeEntity(
    id = id,
    date = date,
    amountMinor = amountMinor,
    currency = currency.name,
    source = source,
    paymentMethod = paymentMethod.name,
    description = description,
    tags = tags.joinToString(","),
    createdAt = createdAt
)

private fun ExpenseEntity.toDomain() = Expense(
    id = id,
    date = date,
    amountMinor = amountMinor,
    categoryId = categoryId,
    currency = Currency.valueOf(currency),
    merchant = merchant,
    reason = reason,
    notes = notes,
    paymentMethod = PaymentMethod.valueOf(paymentMethod),
    tags = if (tags.isNotBlank()) tags.split(",") else emptyList(),
    createdAt = createdAt
)

private fun Expense.toEntity() = ExpenseEntity(
    id = id,
    date = date,
    amountMinor = amountMinor,
    categoryId = categoryId,
    currency = currency.name,
    merchant = merchant,
    reason = reason,
    notes = notes,
    paymentMethod = paymentMethod.name,
    tags = tags.joinToString(","),
    createdAt = createdAt
)

private fun DebtEntity.toDomain() = Debt(
    id = id,
    type = DebtType.valueOf(type),
    personName = personName,
    contactInfo = contactInfo,
    originalAmountMinor = originalAmountMinor,
    currency = Currency.valueOf(currency),
    startDate = startDate,
    dueDate = dueDate,
    reason = reason,
    notes = notes,
    status = DebtStatus.valueOf(status),
    createdAt = createdAt,
    updatedAt = updatedAt
)

private fun Debt.toEntity() = DebtEntity(
    id = id,
    type = type.name,
    personName = personName,
    contactInfo = contactInfo,
    originalAmountMinor = originalAmountMinor,
    currency = currency.name,
    startDate = startDate,
    dueDate = dueDate,
    reason = reason,
    notes = notes,
    status = status.name,
    createdAt = createdAt,
    updatedAt = updatedAt
)

private fun RepaymentEntity.toDomain() = Repayment(
    id = id,
    debtId = debtId,
    date = date,
    amountMinor = amountMinor,
    currency = Currency.valueOf(currency),
    paymentMethod = PaymentMethod.valueOf(paymentMethod),
    paymentSourceOrDest = paymentSourceOrDest,
    notes = notes,
    createdAt = createdAt
)

private fun Repayment.toEntity() = RepaymentEntity(
    id = id,
    debtId = debtId,
    date = date,
    amountMinor = amountMinor,
    currency = currency.name,
    paymentMethod = paymentMethod.name,
    paymentSourceOrDest = paymentSourceOrDest,
    notes = notes,
    createdAt = createdAt
)

private fun ReminderEntity.toDomain() = Reminder(
    id = id,
    title = title,
    relatedDebtId = relatedDebtId,
    personOrOrg = personOrOrg,
    amountMinor = amountMinor,
    currency = Currency.valueOf(currency),
    dueDate = dueDate,
    reminderDateTime = reminderDateTime,
    repeatSchedule = repeatSchedule,
    notes = notes,
    isCompleted = isCompleted
)

private fun Reminder.toEntity() = ReminderEntity(
    id = id,
    title = title,
    relatedDebtId = relatedDebtId,
    personOrOrg = personOrOrg,
    amountMinor = amountMinor,
    currency = currency.name,
    dueDate = dueDate,
    reminderDateTime = reminderDateTime,
    repeatSchedule = repeatSchedule,
    notes = notes,
    isCompleted = isCompleted
)

private fun SavingsGoalEntity.toDomain() = SavingsGoal(
    id = id,
    name = name,
    currency = Currency.valueOf(currency),
    targetAmountMinor = targetAmountMinor,
    currentAmountMinor = currentAmountMinor,
    targetDate = targetDate,
    notes = notes
)

private fun SavingsGoal.toEntity() = SavingsGoalEntity(
    id = id,
    name = name,
    currency = currency.name,
    targetAmountMinor = targetAmountMinor,
    currentAmountMinor = currentAmountMinor,
    targetDate = targetDate,
    notes = notes
)
