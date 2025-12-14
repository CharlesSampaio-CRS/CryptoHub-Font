import { View, Text, StyleSheet, Dimensions } from "react-native"
import { LineChart } from "react-native-chart-kit"

const screenWidth = Dimensions.get("window").width

const chartData = {
  labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
  datasets: [
    {
      data: [128000, 132000, 129500, 138000, 142000, 139000, 142580],
      color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
      strokeWidth: 3,
    },
  ],
}

export function QuickChart() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Desempenho - 7 dias</Text>

      <LineChart
        data={chartData}
        width={screenWidth - 64}
        height={200}
        chartConfig={{
          backgroundColor: "#141414",
          backgroundGradientFrom: "#141414",
          backgroundGradientTo: "#141414",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: "#10b981",
          },
          propsForBackgroundLines: {
            strokeDasharray: "",
            stroke: "#1a1a1a",
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
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#141414",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  title: {
    fontSize: 15,
    fontWeight: "400",
    color: "#f9fafb",
    marginBottom: 16,
  },
  chart: {
    marginLeft: -16,
    borderRadius: 16,
  },
})
