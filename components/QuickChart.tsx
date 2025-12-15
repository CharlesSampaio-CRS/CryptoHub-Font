import { View, Text, StyleSheet, Dimensions } from "react-native"
import { memo } from "react"
import { LineChart } from "react-native-chart-kit"

const screenWidth = Dimensions.get("window").width

const chartData = {
  labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
  datasets: [
    {
      data: [128000, 132000, 129500, 138000, 142000, 139000, 142580],
      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
      strokeWidth: 3,
    },
  ],
}

export const QuickChart = memo(function QuickChart() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Desempenho - 7 dias</Text>

      <LineChart
        data={chartData}
        width={screenWidth - 64}
        height={200}
        chartConfig={{
          backgroundColor: "#ffffff",
          backgroundGradientFrom: "#ffffff",
          backgroundGradientTo: "#ffffff",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: "#3b82f6",
          },
          propsForBackgroundLines: {
            strokeDasharray: "",
            stroke: "#e3f2fd",
            strokeWidth: 1,
          },
        }}
        bezier
        style={styles.chart}
        withInnerLines={true}
        withOuterLines={false}
        withVerticalLabels={true}
        withHorizontalLabels={false}
        withDots={true}
        withShadow={false}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e3f2fd",
  },
  title: {
    fontSize: 15,
    fontWeight: "400",
    marginBottom: 16,
  },
  chart: {
    marginLeft: -16,
    borderRadius: 16,
  },
})
