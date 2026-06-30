import { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const SCREEN_WIDTH = Dimensions.get("window").width;

function SkeletonBox({ width, height, borderRadius = 6 }: {
  width: number | string;
  height: number;
  borderRadius?: number;
}) {
  const translateX = useRef(new Animated.Value(-SCREEN_WIDTH)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(translateX, {
        toValue: SCREEN_WIDTH,
        duration: 1400,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View
      style={[
        s.box,
        { width: width as any, height, borderRadius, overflow: "hidden" },
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateX }] },
        ]}
      >
        <LinearGradient
          colors={[
            "transparent",
            "rgba(108, 71, 255, 0.15)",
            "transparent",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, width: SCREEN_WIDTH }}
        />
      </Animated.View>

    </View>
  );
}

export function VideoSkeleton() {
  return (
    <View style={s.container}>
      <SkeletonBox width="100%" height={210} borderRadius={12} />
      <View style={{ height: 12 }} />
      <SkeletonBox width="90%" height={11} />
      <View style={{ height: 7 }} />
      <SkeletonBox width="60%" height={11} />
      <View style={{ height: 16 }} />
      <View style={s.btnRow}>
        <SkeletonBox width="48%" height={42} borderRadius={10} />
        <SkeletonBox width="48%" height={42} borderRadius={10} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginBottom: 20 },
  box: { backgroundColor: "#1e1e2e" },
  btnRow: { flexDirection: "row", justifyContent: "space-between" },
});