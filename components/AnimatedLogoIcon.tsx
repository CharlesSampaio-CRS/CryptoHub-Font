import { useEffect, useRef } from "react"
import { Animated, Easing, Platform } from "react-native"
import Svg, { Circle, Line, Defs, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from "react-native-svg"

interface AnimatedLogoIconProps {
  size?: number
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

export const AnimatedLogoIcon = ({ size = 40 }: AnimatedLogoIconProps) => {
  const rotateAnim = useRef(new Animated.Value(0)).current
  const pulse1 = useRef(new Animated.Value(1)).current
  const pulse2 = useRef(new Animated.Value(1)).current
  const pulse3 = useRef(new Animated.Value(1)).current
  const pulse4 = useRef(new Animated.Value(1)).current
  const cornerPulse = useRef(new Animated.Value(1)).current

  useEffect(() => {
    console.log('🎨 AnimatedLogoIcon mounted, starting animations...', {
      platform: Platform.OS,
      size
    })
    
    // Rotação contínua - sempre loop infinito
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start()
    
    console.log('✅ Rotation animation started!')
    
    // Pulso dos satélites principais em sequência
    const createPulse = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1.3,
            duration: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            easing: Easing.in(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      )
    }
    
    // Pulso dos nós de canto
    Animated.loop(
      Animated.sequence([
        Animated.timing(cornerPulse, {
          toValue: 1.2,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(cornerPulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start()
    
    createPulse(pulse1, 0).start()
    createPulse(pulse2, 200).start()
    createPulse(pulse3, 400).start()
    createPulse(pulse4, 600).start()
    
    console.log('✅ All AnimatedLogoIcon animations started successfully!')
    
    // Não precisa de cleanup porque loop roda infinitamente
  }, []) // Dependências vazias para rodar só uma vez

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
      <Circle cx="512" cy="512" r="140" fill="#FFC107" filter="url(#glow-anim)"/>
      <Circle cx="512" cy="512" r="100" fill="#F59E0B"/>
      
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
      <AnimatedCircle 
        cx="512" 
        cy="200" 
        r={pulse1.interpolate({
          inputRange: [1, 1.3],
          outputRange: [70, 91]
        })} 
        fill="#3B82F6" 
        filter="url(#glow-anim)"
        opacity={pulse1.interpolate({
          inputRange: [1, 1.3],
          outputRange: [1, 0.8]
        })}
      />
      <AnimatedCircle 
        cx="512" 
        cy="200" 
        r={pulse1.interpolate({
          inputRange: [1, 1.3],
          outputRange: [50, 65]
        })} 
        fill="#2563EB"
      />
      
      <AnimatedCircle 
        cx="824" 
        cy="512" 
        r={pulse2.interpolate({
          inputRange: [1, 1.3],
          outputRange: [70, 91]
        })} 
        fill="#3B82F6" 
        filter="url(#glow-anim)"
        opacity={pulse2.interpolate({
          inputRange: [1, 1.3],
          outputRange: [1, 0.8]
        })}
      />
      <AnimatedCircle 
        cx="824" 
        cy="512" 
        r={pulse2.interpolate({
          inputRange: [1, 1.3],
          outputRange: [50, 65]
        })} 
        fill="#2563EB"
      />
      
      <AnimatedCircle 
        cx="512" 
        cy="824" 
        r={pulse3.interpolate({
          inputRange: [1, 1.3],
          outputRange: [70, 91]
        })} 
        fill="#3B82F6" 
        filter="url(#glow-anim)"
        opacity={pulse3.interpolate({
          inputRange: [1, 1.3],
          outputRange: [1, 0.8]
        })}
      />
      <AnimatedCircle 
        cx="512" 
        cy="824" 
        r={pulse3.interpolate({
          inputRange: [1, 1.3],
          outputRange: [50, 65]
        })} 
        fill="#2563EB"
      />
      
      <AnimatedCircle 
        cx="200" 
        cy="512" 
        r={pulse4.interpolate({
          inputRange: [1, 1.3],
          outputRange: [70, 91]
        })} 
        fill="#3B82F6" 
        filter="url(#glow-anim)"
        opacity={pulse4.interpolate({
          inputRange: [1, 1.3],
          outputRange: [1, 0.8]
        })}
      />
      <AnimatedCircle 
        cx="200" 
        cy="512" 
        r={pulse4.interpolate({
          inputRange: [1, 1.3],
          outputRange: [50, 65]
        })} 
        fill="#2563EB"
      />
      
      {/* Corner nodes */}
      <AnimatedCircle 
        cx="268" 
        cy="268" 
        r={cornerPulse.interpolate({
          inputRange: [1, 1.2],
          outputRange: [50, 60]
        })} 
        fill="#3B82F6" 
        opacity="0.8"
      />
      <AnimatedCircle 
        cx="756" 
        cy="268" 
        r={cornerPulse.interpolate({
          inputRange: [1, 1.2],
          outputRange: [50, 60]
        })} 
        fill="#3B82F6" 
        opacity="0.8"
      />
      <AnimatedCircle 
        cx="756" 
        cy="756" 
        r={cornerPulse.interpolate({
          inputRange: [1, 1.2],
          outputRange: [50, 60]
        })} 
        fill="#3B82F6" 
        opacity="0.8"
      />
      <AnimatedCircle 
        cx="268" 
        cy="756" 
        r={cornerPulse.interpolate({
          inputRange: [1, 1.2],
          outputRange: [50, 60]
        })} 
        fill="#3B82F6" 
        opacity="0.8"
      />
    </AnimatedSvg>
  )
}
