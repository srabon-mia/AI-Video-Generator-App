import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#0f0f1a",
            borderTopColor: "#2a2a3a",
            borderTopWidth: 0.5,
            paddingBottom: 8,
            paddingTop: 8,
            height: 60,
          },
          tabBarActiveTintColor: "#a78bfa",
          tabBarInactiveTintColor: "#555",
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Generate",
            tabBarIcon: ({ color, size }) => (
              <TabIcon name="✦" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            tabBarIcon: ({ color }) => <TabIcon name="⊙" color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color }) => <TabIcon name="⚙" color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}

function TabIcon({ name, color }: { name: string; color: string }) {
  const { Text } = require("react-native");
  return <Text style={{ color, fontSize: 18 }}>{name}</Text>;
}
