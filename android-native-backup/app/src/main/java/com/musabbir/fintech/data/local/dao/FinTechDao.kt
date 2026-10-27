package com.musabbir.fintech.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.musabbir.fintech.data.local.entity.CategoryEntity
import com.musabbir.fintech.data.local.entity.DebtEntity
import com.musabbir.fintech.data.local.entity.ExpenseEntity
import com.musabbir.fintech.data.local.entity.IncomeEntity
import com.musabbir.fintech.data.local.entity.ReminderEntity
import com.musabbir.fintech.data.local.entity.RepaymentEntity
import com.musabbir.fintech.data.local.entity.SavingsGoalEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface FinTechDao {

    // CATEGORIES
    @Query("SELECT * FROM categories WHERE currency = :currency AND isArchived = 0 ORDER BY name ASC")
    fun getActiveCategories(currency: String): Flow<List<CategoryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCategory(category: CategoryEntity)

    @Update
    suspend fun updateCategory(category: CategoryEntity)

    @Query("DELETE FROM categories WHERE id = :id")
    suspend fun deleteCategory(id: String)

    @Query("UPDATE expenses SET categoryId = :newCategoryId WHERE categoryId = :oldCategoryId")
    suspend fun reassignExpensesCategory(oldCategoryId: String, newCategoryId: String)

    // INCOMES
    @Query("SELECT * FROM incomes WHERE currency = :currency ORDER BY date DESC, createdAt DESC")
    fun getIncomesByCurrency(currency: String): Flow<List<IncomeEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertIncome(income: IncomeEntity)

    @Update
    suspend fun updateIncome(income: IncomeEntity)

    @Query("DELETE FROM incomes WHERE id = :id")
    suspend fun deleteIncome(id: String)

    // EXPENSES
    @Query("SELECT * FROM expenses WHERE currency = :currency ORDER BY date DESC, createdAt DESC")
    fun getExpensesByCurrency(currency: String): Flow<List<ExpenseEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertExpense(expense: ExpenseEntity)

    @Update
    suspend fun updateExpense(expense: ExpenseEntity)

    @Query("DELETE FROM expenses WHERE id = :id")
    suspend fun deleteExpense(id: String)

    // DEBTS & CREDITS
    @Query("SELECT * FROM debts WHERE currency = :currency ORDER BY createdAt DESC")
    fun getDebtsByCurrency(currency: String): Flow<List<DebtEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDebt(debt: DebtEntity)

    @Update
    suspend fun updateDebt(debt: DebtEntity)

    @Query("DELETE FROM debts WHERE id = :id")
    suspend fun deleteDebt(id: String)

    // REPAYMENTS
    @Query("SELECT * FROM repayments WHERE currency = :currency ORDER BY date DESC")
    fun getRepaymentsByCurrency(currency: String): Flow<List<RepaymentEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRepayment(repayment: RepaymentEntity)

    @Query("DELETE FROM repayments WHERE id = :id")
    suspend fun deleteRepayment(id: String)

    @Query("DELETE FROM repayments WHERE debtId = :debtId")
    suspend fun deleteRepaymentsForDebt(debtId: String)

    // REMINDERS
    @Query("SELECT * FROM reminders WHERE currency = :currency ORDER BY dueDate ASC")
    fun getRemindersByCurrency(currency: String): Flow<List<ReminderEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertReminder(reminder: ReminderEntity)

    @Update
    suspend fun updateReminder(reminder: ReminderEntity)

    @Query("DELETE FROM reminders WHERE id = :id")
    suspend fun deleteReminder(id: String)

    // SAVINGS GOALS
    @Query("SELECT * FROM savings_goals WHERE currency = :currency ORDER BY targetDate ASC")
    fun getSavingsGoalsByCurrency(currency: String): Flow<List<SavingsGoalEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSavingsGoal(goal: SavingsGoalEntity)

    @Update
    suspend fun updateSavingsGoal(goal: SavingsGoalEntity)

    @Query("DELETE FROM savings_goals WHERE id = :id")
    suspend fun deleteSavingsGoal(id: String)
}
