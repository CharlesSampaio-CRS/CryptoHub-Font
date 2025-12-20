import { useEffect, useRef } from "react"
import { Animated, Easing } from "react-native"
import Svg, { Circle, Line, Defs, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from "react-native-svg"

interface AnimatedLogoIconProps {
  size?: number
}

export const AnimatedLogoIcon = ({ size = 40 }: AnimatedLogoIconProps) => {
  const rotateAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const rotation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    )
    rotation.start()
    
    return () => rotation.stop()
  }, [rotateAnim])

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const AnimatedSvg = Animated.createAnimatedComponent(Svg)

  return (
    <AnimatedSvg 
      width={size} 
      height={size} 
      viewBox="0 0 1024 1024" 
      fill="none"
      style={{ transform: [{ rotate }] }}
    >
      <Defs>
        <Filter id="glow-anim">
          <FeGaussianBlur stdDeviation="10" result="coloredBlur"/>
          <FeMerge>
            <FeMergeNode in="coloredBlur"/>
            <FeMergeNode in="SourceGraphic"/>
          </FeMerge>
        </Filter>
      </Defs>
      
      {/* Central Hub Circle */}
      <Circle cx="512" cy="512" r="140" fill="#3B82F6" filter="url(#glow-anim)"/>
      <Circle cx="512" cy="512" r="100" fill="#1E40AF"/>
      
      {/* Connection lines */}
      <Line x1="512" y1="412" x2="512" y2="220" stroke="#60A5FA" strokeWidth="12" opacity="0.6"/>
      <Line x1="612" y1="512" x2="804" y2="512" stroke="#60A5FA" strokeWidth="12" opacity="0.6"/>
      <Line x1="512" y1="612" x2="512" y2="804" stroke="#60A5FA" strokeWidth="12" opacity="0.6"/>
      <Line x1="412" y1="512" x2="220" y2="512" stroke="#60A5FA" strokeWidth="12" opacity="0.6"/>
      
      {/* Diagonal connections */}
      <Line x1="598" y1="426" x2="738" y2="286" stroke="#60A5FA" strokeWidth="10" opacity="0.4"/>
      <Line x1="598" y1="598" x2="738" y2="738" stroke="#60A5FA" strokeWidth="10" opacity="0.4"/>
      <Line x1="426" y1="598" x2="286" y2="738" stroke="#60A5FA" strokeWidth="10" opacity="0.4"/>
      <Line x1="426" y1="426" x2="286" y2="286" stroke="#60A5FA" strokeWidth="10" opacity="0.4"/>
      
      {/* Satellite Nodes */}
      <Circle cx="512" cy="200" r="70" fill="#FFC107" filter="url(#glow-anim)"/>
      <Circle cx="512" cy="200" r="50" fill="#F59E0B"/>
      
      <Circle cx="824" cy="512" r="70" fill="#FFC107" filter="url(#glow-anim)"/>
      <Circle cx="824" cy="512" r="50" fill="#F59E0B"/>
      
      <Circle cx="512" cy="824" r="70" fill="#FFC107" filter="url(#glow-anim)"/>
      <Circle cx="512" cy="824" r="50" fill="#F59E0B"/>
      
      <Circle cx="200" cy="512" r="70" fill="#FFC107" filter="url(#glow-anim)"/>
      <Circle cx="200" cy="512" r="50" fill="#F59E0B"/>
      
      {/* Corner nodes */}
      <Circle cx="268" cy="268" r="50" fill="#3B82F6" opacity="0.8"/>
      <Circle cx="756" cy="268" r="50" fill="#3B82F6" opacity="0.8"/>
      <Circle cx="756" cy="756" r="50" fill="#3B82F6" opacity="0.8"/>
      <Circle cx="268" cy="756" r="50" fill="#3B82F6" opacity="0.8"/>
    </AnimatedSvg>
  )
}
