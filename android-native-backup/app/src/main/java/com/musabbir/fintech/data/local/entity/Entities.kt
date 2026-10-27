package com.musabbir.fintech.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.musabbir.fintech.domain.model.Currency
import com.musabbir.fintech.domain.model.DebtStatus
import com.musabbir.fintech.domain.model.DebtType
import com.musabbir.fintech.domain.model.PaymentMethod

@Entity(tableName = "categories")
data class CategoryEntity(
    @PrimaryKey val id: String,
    val name: String,
    val currency: String, // "AED" or "INR"
    val icon: String,
    val color: String,
    val description: String?,
    val monthlyBudgetMinor: Long?,
    val isCustom: Boolean,
    val isArchived: Boolean,
    val createdAt: Long,
    val updatedAt: Long
)

@Entity(tableName = "incomes")
data class IncomeEntity(
    @PrimaryKey val id: String,
    val date: String,
    val amountMinor: Long,
    val currency: String,
    val source: String,
    val paymentMethod: String,
    val description: String?,
    val tags: String, // Comma-separated
    val createdAt: Long
)

@Entity(tableName = "expenses")
data class ExpenseEntity(
    @PrimaryKey val id: String,
    val date: String,
    val amountMinor: Long,
    val categoryId: String,
    val currency: String,
    val merchant: String,
    val reason: String,
    val notes: String?,
    val paymentMethod: String,
    val tags: String,
    val createdAt: Long
)

@Entity(tableName = "debts")
data class DebtEntity(
    @PrimaryKey val id: String,
    val type: String, // "DEBIT" or "CREDIT"
    val personName: String,
    val contactInfo: String?,
    val originalAmountMinor: Long,
    val currency: String,
    val startDate: String,
    val dueDate: String?,
    val reason: String,
    val notes: String?,
    val status: String,
    val createdAt: Long,
    val updatedAt: Long
)

@Entity(tableName = "repayments")
data class RepaymentEntity(
    @PrimaryKey val id: String,
    val debtId: String,
    val date: String,
    val amountMinor: Long,
    val currency: String,
    val paymentMethod: String,
    val paymentSourceOrDest: String?,
    val notes: String?,
    val createdAt: Long
)

@Entity(tableName = "reminders")
data class ReminderEntity(
    @PrimaryKey val id: String,
    val title: String,
    val relatedDebtId: String?,
    val personOrOrg: String,
    val amountMinor: Long?,
    val currency: String,
    val dueDate: String,
    val reminderDateTime: String,
    val repeatSchedule: String,
    val notes: String?,
    val isCompleted: Boolean
)

@Entity(tableName = "savings_goals")
data class SavingsGoalEntity(
    @PrimaryKey val id: String,
    val name: String,
    val currency: String,
    val targetAmountMinor: Long,
    val currentAmountMinor: Long,
    val targetDate: String,
    val notes: String?
)
