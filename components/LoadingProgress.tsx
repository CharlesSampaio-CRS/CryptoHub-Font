import React, { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Easing } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'

interface LoadingProgressProps {
  visible: boolean
}

export function LoadingProgress({ visible }: LoadingProgressProps) {
  const { colors, isDark } = useTheme()
  const { t } = useLanguage()
  const [currentStep, setCurrentStep] = useState(0)
  
  const steps = [
    { key: 'loading.authenticating' },
    { key: 'loading.fetchingExchanges' },
    { key: 'loading.loadingBalances' },
    { key: 'loading.calculatingPortfolio' },
    { key: 'loading.almostReady' },
  ]

  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current
  const spinValue = useRef(new Animated.Value(0)).current
  const spinnerPulse = useRef(new Animated.Value(1)).current
  const textFadeAnim = useRef(new Animated.Value(1)).current
  const textShimmer = useRef(new Animated.Value(0)).current
  const dotsAnimations = useRef(
    steps.map(() => new Animated.Value(0))
  ).current
  // Partículas flutuantes ao redor do spinner
  const particles = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current

  console.log('🔄 LoadingProgress - visible:', visible, 'currentStep:', currentStep)

  // Animação de entrada
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      fadeAnim.setValue(0)
      scaleAnim.setValue(0.9)
      setCurrentStep(0)
    }
  }, [visible])

  // Animação de rotação contínua
  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start()
    } else {
      spinValue.setValue(0)
    }
  }, [visible])

  // Animação de pulso no spinner (respira)
  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(spinnerPulse, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(spinnerPulse, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start()
    } else {
      spinnerPulse.setValue(1)
    }
  }, [visible])

  // Animação de fade no texto quando muda de step
  useEffect(() => {
    if (visible) {
      // Fade out -> Fade in
      Animated.sequence([
        Animated.timing(textFadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [currentStep, visible])

  // Efeito shimmer no texto (brilho suave passando)
  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.timing(textShimmer, {
          toValue: 1,
          duration: 2500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start()
    } else {
      textShimmer.setValue(0)
    }
  }, [visible])

  // Animação de partículas flutuantes
  useEffect(() => {
    if (visible) {
      particles.forEach((particle, index) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(particle, {
              toValue: 1,
              duration: 2000 + index * 500, // Diferentes velocidades
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(particle, {
              toValue: 0,
              duration: 2000 + index * 500,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start()
      })
    }
  }, [visible])

  // Animação pulsante nos dots
  useEffect(() => {
    if (visible) {
      dotsAnimations.forEach((anim, index) => {
        if (index <= currentStep) {
          // Dot ativo: pulsa
          Animated.loop(
            Animated.sequence([
              Animated.timing(anim, {
                toValue: 1,
                duration: 600,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(anim, {
                toValue: 0,
                duration: 600,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
              }),
            ])
          ).start()
        } else {
          // Dot inativo: sem animação
          anim.setValue(0)
        }
      })
    }
  }, [currentStep, visible])

  // Progressão dos steps com tempo mínimo entre cada um
  useEffect(() => {
    console.log('🔄 LoadingProgress useEffect - visible:', visible)
    if (!visible) {
      setCurrentStep(0)
      return
    }

    // Avança steps gradualmente para dar feedback visual
    const stepDurations = [500, 800, 1000, 800, 500] // Duração mínima de cada step
    let currentIndex = 0
    const timers: NodeJS.Timeout[] = []

    const scheduleNext = () => {
      if (currentIndex < steps.length - 1) { // -1 para não avançar além do último
        const timer = setTimeout(() => {
          currentIndex++
          setCurrentStep(currentIndex)
          scheduleNext()
        }, stepDurations[currentIndex] || 800)
        
        timers.push(timer)
      }
    }

    // Inicia a progressão
    scheduleNext()

    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [visible])

  if (!visible) return null

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const currentStepText = currentStep < steps.length ? t(steps[currentStep].key) : t('loading.almostReady')

  // Interpolação do shimmer para criar efeito de brilho
  const shimmerOpacity = textShimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.7, 1, 0.7],
  })

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: isDark ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)',
          opacity: fadeAnim 
        }
      ]}
    >
      <Animated.View 
        style={[
          styles.content,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        {/* Logo/Spinner customizado com rotação e pulso */}
        <View style={styles.spinnerWrapper}>
          <Animated.View 
            style={[
              styles.spinnerContainer, 
              { 
                transform: [
                  { rotate: spin },
                  { scale: spinnerPulse }
                ] 
              }
            ]}
          >
            <View style={[styles.spinner, { borderColor: colors.primary }]} />
          </Animated.View>

          {/* Partículas flutuantes */}
          {particles.map((particle, index) => {
            const translateY = particle.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -20],
            })
            const opacity = particle.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.3, 0.8, 0.3],
            })
            const positions = [
              { top: 10, left: -30 },
              { top: 40, right: -30 },
              { bottom: 15, left: -25 },
            ]

            return (
              <Animated.View
                key={index}
                style={[
                  styles.particle,
                  {
                    backgroundColor: colors.primary,
                    ...positions[index],
                    opacity,
                    transform: [{ translateY }],
                  },
                ]}
              />
            )
          })}
        </View>

        {/* Texto do step atual com animação de fade e shimmer */}
        <Animated.Text 
          style={[
            styles.stepText, 
            { 
              color: colors.text,
              opacity: Animated.multiply(textFadeAnim, shimmerOpacity)
            }
          ]}
        >
          {currentStepText}
        </Animated.Text>

        {/* Dots de progresso com animação pulsante */}
        <View style={styles.dotsContainer}>
          {steps.map((_, index) => {
            const dotScale = dotsAnimations[index].interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.3],
            })

            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index <= currentStep ? colors.primary : colors.border,
                    opacity: index <= currentStep ? 1 : 0.3,
                    transform: [{ scale: index === currentStep ? dotScale : 1 }],
                  },
                ]}
              />
            )
          })}
        </View>
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  spinnerWrapper: {
    position: 'relative',
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stepText: {
    fontSize: 15,
    fontWeight: '400',
    marginBottom: 24,
    letterSpacing: 0.3,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
})
