package com.musabbir.fintech.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import com.musabbir.fintech.data.local.dao.FinTechDao
import com.musabbir.fintech.data.local.entity.CategoryEntity
import com.musabbir.fintech.data.local.entity.DebtEntity
import com.musabbir.fintech.data.local.entity.ExpenseEntity
import com.musabbir.fintech.data.local.entity.IncomeEntity
import com.musabbir.fintech.data.local.entity.ReminderEntity
import com.musabbir.fintech.data.local.entity.RepaymentEntity
import com.musabbir.fintech.data.local.entity.SavingsGoalEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [
        CategoryEntity::class,
        IncomeEntity::class,
        ExpenseEntity::class,
        DebtEntity::class,
        RepaymentEntity::class,
        ReminderEntity::class,
        SavingsGoalEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class FinTechDatabase : RoomDatabase() {
    abstract fun dao(): FinTechDao

    companion object {
        @Volatile
        private var INSTANCE: FinTechDatabase? = null

        fun getDatabase(context: Context, scope: CoroutineScope): FinTechDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    FinTechDatabase::class.java,
                    "fintech_room.db"
                )
                    .addCallback(FinTechDatabaseCallback(scope))
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }

    private class FinTechDatabaseCallback(
        private val scope: CoroutineScope
    ) : RoomDatabase.Callback() {
        override fun onCreate(db: SupportSQLiteDatabase) {
            super.onCreate(db)
            INSTANCE?.let { database ->
                scope.launch(Dispatchers.IO) {
                    populateInitialCategories(database.dao())
                }
            }
        }

        private suspend fun populateInitialCategories(dao: FinTechDao) {
            val now = System.currentTimeMillis()
            val categoriesRaw = listOf(
                Triple("Family & Remittance", "HeartHandshake", "#ec4899"),
                Triple("Food & Dining", "UtensilsCrossed", "#f97316"),
                Triple("Groceries & Supermarket", "ShoppingCart", "#10b981"),
                Triple("Health & Pharmacy", "Activity", "#06b6d4"),
                Triple("Housing & Rent", "Home", "#8b5cf6"),
                Triple("Other & Miscellaneous", "Layers", "#64748b"),
                Triple("Shopping & Electronics", "ShoppingBag", "#3b82f6"),
                Triple("Transport, Salik & Fuel", "Car", "#eab308"),
                Triple("Utilities & DEWA", "Zap", "#f59e0b")
            )

            for (curr in listOf("AED", "INR")) {
                for (cat in categoriesRaw) {
                    val safeId = "cat_${curr.lowercase()}_${cat.first.lowercase().replace(Regex("[^a-z0-9]"), "_")}"
                    val budget = if (curr == "AED") 150000L else 1500000L
                    dao.insertCategory(
                        CategoryEntity(
                            id = safeId,
                            name = cat.first,
                            currency = curr,
                            icon = cat.second,
                            color = cat.third,
                            description = "Standard category for ${cat.first} ($curr)",
                            monthlyBudgetMinor = budget,
                            isCustom = false,
                            isArchived = false,
                            createdAt = now,
                            updatedAt = now
                        )
                    )
                }
            }
        }
    }
}
