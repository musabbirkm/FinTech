package com.musabbir.fintech.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.musabbir.fintech.config.AppConfig
import com.musabbir.fintech.domain.model.Currency

/**
 * Top Bar with Branding and Prominent AED/INR Currency Switcher.
 */
@Composable
fun FinTechTopBar(
    currentCurrency: Currency,
    onCurrencyChanged: (Currency) -> Unit,
    title: String = AppConfig.APP_NAME
) {
    Surface(
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 3.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.ExtraBold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "Dirham & Rupee Tracker",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Currency Switcher
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFF0F172A))
                    .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(12.dp))
                    .padding(3.dp)
            ) {
                CurrencyButton(
                    label = "AED (د.إ)",
                    isSelected = currentCurrency == Currency.AED,
                    onClick = { onCurrencyChanged(Currency.AED) }
                )
                Spacer(modifier = Modifier.width(4.dp))
                CurrencyButton(
                    label = "INR (₹)",
                    isSelected = currentCurrency == Currency.INR,
                    onClick = { onCurrencyChanged(Currency.INR) }
                )
            }
        }
    }
}

@Composable
fun CurrencyButton(
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(if (isSelected) Color(0xFF10B981) else Color.Transparent)
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 6.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            fontSize = 11.sp,
            fontWeight = if (isSelected) FontWeight.ExtraBold else FontWeight.Medium,
            color = if (isSelected) Color(0xFF020617) else Color(0xFF94A3B8)
        )
    }
}

/**
 * Official Application Footer and Developer Credit.
 * MUST be placed at the very bottom of the scrollable content, never fixed on screen.
 */
@Composable
fun AppFooter(
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(top = 32.dp, bottom = 48.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        HorizontalDivider(
            color = Color(0xFF1E293B),
            thickness = 1.dp,
            modifier = Modifier.padding(horizontal = 32.dp, vertical = 16.dp)
        )
        Text(
            text = "FinTech — Dirham & Rupee Smart Expense Tracker",
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium,
            color = Color(0xFF94A3B8),
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = AppConfig.OFFICIAL_FOOTER_CREDIT,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color(0xFF10B981),
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "Zero cross-currency mixing. Local device persistence.",
            fontSize = 10.sp,
            color = Color(0xFF64748B),
            textAlign = TextAlign.Center
        )
    }
}
