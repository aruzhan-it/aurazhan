import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Modal,
  Image,
  ImageBackground,
  Linking,
  Dimensions,
  PanResponder,
  AppState,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { createClient } from '@supabase/supabase-js';
import * as ImagePicker from 'expo-image-picker';

let AsyncStorageMod = null;
try {
  AsyncStorageMod = require('@react-native-async-storage/async-storage').default;
} catch (_) {
  AsyncStorageMod = null;
}

if (!globalThis.__CLOSED_CIRCLE_RUNTIME__) {
  globalThis.__CLOSED_CIRCLE_RUNTIME__ = {
    storage: new Map(),
    sessionUserId: null,
    sessionProfile: null,
    pinByUser: new Map(),
  };
}

const rt = globalThis.__CLOSED_CIRCLE_RUNTIME__;

const localStore = {
  async getItem(key) {
    try {
      if (AsyncStorageMod && typeof AsyncStorageMod.getItem === 'function') {
        const val = await AsyncStorageMod.getItem(key);
        if (val !== null && val !== undefined) {
          rt.storage.set(key, val);
          return val;
        }
      }
    } catch (_) {}
    return rt.storage.has(key) ? rt.storage.get(key) : null;
  },
  async setItem(key, val) {
    const str = String(val);
    rt.storage.set(key, str);
    try {
      if (AsyncStorageMod && typeof AsyncStorageMod.setItem === 'function') {
        await AsyncStorageMod.setItem(key, str);
      }
    } catch (_) {}
  },
  async removeItem(key) {
    rt.storage.delete(key);
    try {
      if (AsyncStorageMod && typeof AsyncStorageMod.removeItem === 'function') {
        await AsyncStorageMod.removeItem(key);
      }
    } catch (_) {}
  },
};

const SESSION_USER_ID_KEY = '@closed_circle_session_user_id_v2';
const SESSION_PROFILE_KEY = '@closed_circle_session_profile_v2';
const LOCAL_PIN_KEY_PREFIX = '@closed_circle_pin_v2_';

let CHAT_BG_SOURCE = null;
try {
  CHAT_BG_SOURCE = require('./2099f2dda704cb708fe20347afb964ba.jpg');
} catch (_) {
  try {
    CHAT_BG_SOURCE = require('./assets/2099f2dda704cb708fe20347afb964ba.jpg');
  } catch (__) {
    CHAT_BG_SOURCE = null;
  }
}

let ExpoAudioModule = null;
let ExpoAvModule = null;
try {
  ExpoAudioModule = require('expo-audio');
} catch (_) {
  ExpoAudioModule = null;
}
try {
  ExpoAvModule = require('expo-av');
} catch (_) {
  ExpoAvModule = null;
}

let DocumentPickerModule = null;
try {
  DocumentPickerModule = require('expo-document-picker');
} catch (_) {
  DocumentPickerModule = null;
}

const SUPABASE_URL = 'https://xpwbyptptbqaprfbzwcb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JlFyIuAk6Rg-dEVpxsJjIg_LWllg4Oq';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const EMOJIS = ['💜', '🔥', '😂', '🥺', '✨', '👀'];
const EXTRA_EMOJIS = ['❤️', '👍', '👎', '🥰', '😭', '🤯', '👏', '🙏', '🎉', '🫡', '💔', '🤝'];

const STICKER_PACK = [
  { id: 'study', emoji: '📚', label: 'На паре' },
  { id: 'sleep', emoji: '😴', label: 'Сплю' },
  { id: 'coffee', emoji: '☕', label: 'Кофе' },
  { id: 'music', emoji: '🎧', label: 'В наушниках' },
  { id: 'game', emoji: '🎮', label: 'Играю' },
  { id: 'focus', emoji: '🔥', label: 'В потоке' },
  { id: 'moon', emoji: '🌙', label: 'Ночь' },
  { id: 'think', emoji: '💭', label: 'Думаю' },
];

const THEMES = {
  dark: {
    isDark: true,
    bg: '#141518',
    surface: '#1d1f24',
    surfaceAlt: '#262930',
    border: '#2f333d',
    text: '#f3f4f6',
    textMuted: '#8d92a0',
    accent: '#e05a67',
    accentSoft: 'rgba(224, 90, 103, 0.16)',
    accentText: '#f27c88',
    bubbleMine: '#cf5360',
    bubblePeer: '#23262d',
    bubbleMineText: '#ffffff',
    bubblePeerText: '#f3f4f6',
    noteBubble: '#23262e',
    noteBubbleBorder: '#353a46',
    dangerBg: 'rgba(239, 68, 68, 0.16)',
    dangerText: '#f87171',
  },
  light: {
    isDark: false,
    bg: '#f4f5f7',
    surface: '#ffffff',
    surfaceAlt: '#eef0f4',
    border: '#e2e5ec',
    text: '#16181d',
    textMuted: '#6b707d',
    accent: '#d64c5a',
    accentSoft: 'rgba(214, 76, 90, 0.12)',
    accentText: '#d64c5a',
    bubbleMine: '#d64c5a',
    bubblePeer: '#ffffff',
    bubbleMineText: '#ffffff',
    bubblePeerText: '#16181d',
    noteBubble: '#fdf2f3',
    noteBubbleBorder: '#f6cbd0',
    dangerBg: '#fef2f2',
    dangerText: '#dc2626',
  },
};

const SCREEN_WIDTH = Dimensions.get('window').width;

function normalizeId(raw) {
  return (raw || '')
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/\s+/g, '_');
}

function cleanPinDigits(raw) {
  return String(raw || '').replace(/\D/g, '').slice(0, 4);
}

function generateUniqueId() {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `id_${num}`;
}

function generateTempPass() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function makeRoomId(idA, idB) {
  const a = normalizeId(idA || 'user_a');
  const b = normalizeId(idB || 'user_b');
  if (a === b) return `self__${a}`;
  return [a, b].sort().join('__');
}

function makeGroupRoomId(groupId) {
  return `group__${groupId}`;
}

function formatTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(totalSec) {
  const sec = Math.max(0, Math.floor(Number(totalSec) || 0));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatSeenAgo(isoString) {
  if (!isoString) return 'Прочитано';
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
  if (diffSec < 45) return 'Прочитано только что';
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `Прочитано ${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Прочитано ${hours} ч назад`;
  return `Прочитано в ${formatTime(isoString)}`;
}

function parseRichBody(body) {
  if (!body || typeof body !== 'string') {
    return { kind: 'text', text: '', forwardedFrom: null, replyTo: null, meta: {} };
  }
  if (body.startsWith('{')) {
    try {
      const parsed = JSON.parse(body);
      if (parsed && parsed.kind === 'group_meta') {
        return {
          kind: 'group_meta',
          text: parsed.title || 'Группа',
          forwardedFrom: null,
          replyTo: null,
          meta: parsed,
        };
      }
      if (parsed && parsed.kind === 'image' && parsed.uri) {
        return {
          kind: 'image',
          text: parsed.caption || '',
          forwardedFrom: parsed.forwardedFrom || null,
          replyTo: parsed.replyTo || null,
          meta: parsed,
        };
      }
      if (parsed && parsed.kind === 'file') {
        return {
          kind: 'file',
          text: parsed.name || 'Файл',
          forwardedFrom: parsed.forwardedFrom || null,
          replyTo: parsed.replyTo || null,
          meta: parsed,
        };
      }
      if (parsed && parsed.kind === 'voice') {
        return {
          kind: 'voice',
          text: `Голосовое (${formatDuration(parsed.duration || 1)})`,
          forwardedFrom: parsed.forwardedFrom || null,
          replyTo: parsed.replyTo || null,
          meta: parsed,
        };
      }
      if (parsed && parsed.kind === 'text') {
        return {
          kind: 'text',
          text: parsed.text || '',
          forwardedFrom: parsed.forwardedFrom || null,
          replyTo: parsed.replyTo || null,
          meta: parsed,
        };
      }
    } catch (_) {
      return { kind: 'text', text: body, forwardedFrom: null, replyTo: null, meta: {} };
    }
  }
  return { kind: 'text', text: body, forwardedFrom: null, replyTo: null, meta: {} };
}

function getPreviewLabel(body) {
  const parsed = parseRichBody(body);
  if (parsed.kind === 'image') {
    return parsed.text ? `Фото: ${parsed.text}` : 'Фотография';
  }
  if (parsed.kind === 'file') {
    return `Файл: ${parsed.text}`;
  }
  if (parsed.kind === 'voice') {
    return parsed.text;
  }
  return parsed.text.replace(/\|\|/g, '');
}

function splitSpoilerSegments(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];
  const regex = /\|\|([\s\S]+?)\|\|/g;
  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(rawText)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'plain', value: rawText.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'spoiler', value: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < rawText.length) {
    segments.push({ type: 'plain', value: rawText.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: 'plain', value: rawText }];
}

function SpoilerTextRenderer({ text, isMine, theme, msgId }) {
  const [revealedMap, setRevealedMap] = useState({});
  const segments = splitSpoilerSegments(text);

  const toggleSegment = (idx) => {
    setRevealedMap((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <View style={styles.spoilerFlowWrap}>
      {segments.map((seg, idx) => {
        if (seg.type === 'plain') {
          return (
            <Text
              key={`${msgId}_p_${idx}`}
              style={[
                styles.msgText,
                { color: isMine ? theme.bubbleMineText : theme.bubblePeerText },
              ]}
            >
              {seg.value}
            </Text>
          );
        }

        const isOpen = Boolean(revealedMap[idx]);
        return (
          <TouchableOpacity
            key={`${msgId}_s_${idx}`}
            activeOpacity={0.85}
            onPress={() => toggleSegment(idx)}
            style={[
              styles.spoilerChip,
              {
                backgroundColor: isOpen ? theme.accentSoft : theme.surfaceAlt,
                borderColor: theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.spoilerChipText,
                {
                  color: isMine ? theme.bubbleMineText : theme.bubblePeerText,
                  opacity: isOpen ? 1 : 0.15,
                },
              ]}
            >
              {seg.value}
            </Text>
            {!isOpen && (
              <Text style={[styles.spoilerHintOverlay, { color: theme.accentText }]}>
                Спойлер
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function AvatarCircle({ user, theme, size = 50, isGroup = false, isSelf = false }) {
  return (
    <View style={{ width: size, height: size }}>
      {isGroup ? (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: theme.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#ffffff', fontSize: Math.round(size * 0.38), fontWeight: '700' }}>
            {(user?.title || 'Г').slice(0, 1).toUpperCase()}
          </Text>
        </View>
      ) : isSelf ? (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: theme.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#ffffff', fontSize: Math.round(size * 0.3), fontWeight: '800' }}>
            You
          </Text>
        </View>
      ) : user?.avatar_url ? (
        <Image
          source={{ uri: user.avatar_url }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: theme.accentSoft,
            borderWidth: 1,
            borderColor: theme.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: theme.accentText,
              fontSize: Math.round(size * 0.36),
              fontWeight: '700',
            }}
          >
            {(user?.display_name || user?.login || 'U').slice(0, 1).toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );
}

function PinLockScreen({ theme, profile, expectedPin, onUnlock, onForgotPin }) {
  const [entered, setEntered] = useState('');
  const [errorText, setErrorText] = useState('');
  const cleanExpected = cleanPinDigits(expectedPin);

  const handleDigit = (digit) => {
    if (entered.length >= 4) return;
    setErrorText('');
    const next = entered + digit;
    setEntered(next);

    if (next.length === 4) {
      if (next === cleanExpected) {
        setTimeout(() => {
          setEntered('');
          setErrorText('');
          onUnlock();
        }, 90);
      } else {
        setTimeout(() => {
          setErrorText('Неверный PIN-код');
          setEntered('');
        }, 160);
      }
    }
  };

  const handleBackspace = () => {
    setErrorText('');
    setEntered((prev) => prev.slice(0, -1));
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'forgot', '0', 'del'];

  return (
    <SafeAreaView style={[styles.pinScreen, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
      <View style={styles.pinTopBlock}>
        <AvatarCircle user={profile} theme={theme} size={64} />
        <Text style={[styles.pinTitle, { color: theme.text }]}>Введите PIN-код</Text>
        <Text style={[styles.pinSub, { color: theme.textMuted }]}>
          {profile?.display_name || `@${profile?.login || ''}`}
        </Text>

        <View style={styles.pinDotsRow}>
          {[0, 1, 2, 3].map((idx) => {
            const filled = idx < entered.length;
            return (
              <View
                key={idx}
                style={[
                  styles.pinDot,
                  {
                    backgroundColor: filled ? theme.accent : 'transparent',
                    borderColor: errorText ? theme.dangerText : filled ? theme.accent : theme.border,
                  },
                ]}
              />
            );
          })}
        </View>

        {errorText ? (
          <Text style={[styles.pinErrorText, { color: theme.dangerText }]}>{errorText}</Text>
        ) : (
          <View style={{ height: 20 }} />
        )}
      </View>

      <View style={styles.pinPadGrid}>
        {keys.map((k) => {
          if (k === 'forgot') {
            return (
              <TouchableOpacity
                key={k}
                style={styles.pinKeyGhost}
                onPress={onForgotPin}
              >
                <Text style={[styles.pinKeyGhostText, { color: theme.textMuted }]}>Забыли?</Text>
              </TouchableOpacity>
            );
          }
          if (k === 'del') {
            return (
              <TouchableOpacity
                key={k}
                style={styles.pinKeyGhost}
                onPress={handleBackspace}
              >
                <Text style={[styles.pinKeyGhostText, { color: theme.text }]}>⌫</Text>
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity
              key={k}
              activeOpacity={0.75}
              style={[
                styles.pinKeyCircle,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() => handleDigit(k)}
            >
              <Text style={[styles.pinKeyDigit, { color: theme.text }]}>{k}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

function CallScreenModal({ callState, theme, onHangup }) {
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!callState) {
      setSeconds(0);
      setMuted(false);
      return;
    }
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [callState]);

  if (!callState) return null;

  return (
    <Modal visible={Boolean(callState)} transparent animationType="fade" onRequestClose={onHangup}>
      <SafeAreaView style={[styles.callRoot, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
        <View style={styles.callCenter}>
          <AvatarCircle user={callState.peer} theme={theme} size={104} />
          <Text style={[styles.callName, { color: theme.text }]}>
            {callState.peer?.display_name || 'Собеседник'}
          </Text>
          <Text style={[styles.callStatus, { color: theme.accentText }]}>
            {seconds < 2 ? 'Соединение...' : `В разговоре · ${formatDuration(seconds)}`}
          </Text>
        </View>

        <View style={styles.callControlsRow}>
          <TouchableOpacity
            style={[
              styles.callCircleBtn,
              {
                backgroundColor: muted ? theme.accentSoft : theme.surface,
                borderColor: muted ? theme.accent : theme.border,
              },
            ]}
            onPress={() => setMuted((m) => !m)}
          >
            <Text style={[styles.callBtnLabel, { color: theme.text }]}>
              {muted ? 'Микр. выкл' : 'Микрофон'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.callCircleBtn,
              {
                backgroundColor: speaker ? theme.accentSoft : theme.surface,
                borderColor: speaker ? theme.accent : theme.border,
              },
            ]}
            onPress={() => setSpeaker((s) => !s)}
          >
            <Text style={[styles.callBtnLabel, { color: theme.text }]}>
              {speaker ? 'Динамик' : 'Телефон'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.callHangupBtn, { backgroundColor: '#dc2626' }]}
            onPress={onHangup}
          >
            <Text style={styles.callHangupText}>Завершить</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function PhotoViewerModal({ galleryState, onClose }) {
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > 18 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy < -65 || Math.abs(gestureState.dy) > 110) {
            onClose();
          }
        },
      }),
    [onClose]
  );

  const activePhoto = galleryState.photos[galleryState.index] || null;

  return (
    <Modal visible={galleryState.visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.galleryModalRoot} edges={['top', 'bottom']}>
        <View style={styles.galleryTopBar}>
          <TouchableOpacity
            style={styles.galleryBackBtn}
            onPress={onClose}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Text style={styles.galleryBackArrow}>←</Text>
          </TouchableOpacity>

          <View style={styles.flex1}>
            <Text style={styles.galleryAuthor} numberOfLines={1}>
              {activePhoto?.sender || 'Фото'}
            </Text>
            <Text style={styles.galleryMeta}>
              {galleryState.index + 1} / {Math.max(1, galleryState.photos.length)} · свайп вверх для закрытия
            </Text>
          </View>
        </View>

        <View style={styles.flex1} {...panResponder.panHandlers}>
          <FlatList
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={galleryState.index}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            data={galleryState.photos}
            keyExtractor={(_, idx) => `photo_${idx}`}
            renderItem={({ item }) => (
              <View style={{ width: SCREEN_WIDTH, flex: 1, justifyContent: 'center' }}>
                <Image
                  source={{ uri: item.uri }}
                  style={styles.galleryFullImg}
                  resizeMode="contain"
                />
                {item.caption ? (
                  <Text style={styles.galleryCaption}>{item.caption}</Text>
                ) : null}
              </View>
            )}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function VoiceMessageBubble({ uri, durationSec, isMine, theme, msgId, activeVoiceId, setActiveVoiceId }) {
  const avSoundRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const pollTimerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [positionSec, setPositionSec] = useState(0);
  const [totalSec, setTotalSec] = useState(Math.max(1, Number(durationSec) || 3));

  const isThisActive = activeVoiceId === msgId;

  const clearPoll = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const stopAndCleanup = async () => {
    clearPoll();
    try {
      if (avSoundRef.current) {
        await avSoundRef.current.unloadAsync();
        avSoundRef.current = null;
      }
    } catch (_) {}
    try {
      if (audioPlayerRef.current) {
        if (typeof audioPlayerRef.current.pause === 'function') {
          audioPlayerRef.current.pause();
        }
        if (typeof audioPlayerRef.current.remove === 'function') {
          audioPlayerRef.current.remove();
        }
        audioPlayerRef.current = null;
      }
    } catch (_) {}
    setIsPlaying(false);
    setPositionSec(0);
  };

  useEffect(() => {
    return () => {
      stopAndCleanup();
    };
  }, []);

  useEffect(() => {
    if (!isThisActive && isPlaying) {
      clearPoll();
      setIsPlaying(false);
    }
  }, [isThisActive, isPlaying]);

  const startSimulatedPlayback = () => {
    setIsPlaying(true);
    clearPoll();
    const dur = Math.max(1, totalSec);
    pollTimerRef.current = setInterval(() => {
      setPositionSec((prev) => {
        if (prev + 1 >= dur) {
          clearPoll();
          setIsPlaying(false);
          setActiveVoiceId(null);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const handleTogglePlay = async () => {
    if (isPlaying) {
      clearPoll();
      try {
        if (avSoundRef.current) {
          await avSoundRef.current.pauseAsync();
        }
        if (audioPlayerRef.current && typeof audioPlayerRef.current.pause === 'function') {
          audioPlayerRef.current.pause();
        }
      } catch (_) {}
      setIsPlaying(false);
      return;
    }

    setActiveVoiceId(msgId);

    if (uri && ExpoAudioModule && typeof ExpoAudioModule.createAudioPlayer === 'function') {
      try {
        if (typeof ExpoAudioModule.setAudioModeAsync === 'function') {
          await ExpoAudioModule.setAudioModeAsync({
            playsInSilentMode: true,
            allowsRecording: false,
          });
        }
        if (!audioPlayerRef.current) {
          audioPlayerRef.current = ExpoAudioModule.createAudioPlayer({ uri });
        }
        audioPlayerRef.current.play();
        setIsPlaying(true);
        clearPoll();
        pollTimerRef.current = setInterval(() => {
          const pl = audioPlayerRef.current;
          if (!pl) return;
          const cur = Math.floor(Number(pl.currentTime || 0));
          const dur = Math.max(1, Math.floor(Number(pl.duration || totalSec || 1)));
          setTotalSec(dur);
          setPositionSec(cur);
          if (pl.playing === false && cur > 0) {
            clearPoll();
            setIsPlaying(false);
            setPositionSec(0);
          }
        }, 250);
        return;
      } catch (_) {}
    }

    if (uri && ExpoAvModule && ExpoAvModule.Audio) {
      try {
        await ExpoAvModule.Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
        if (!avSoundRef.current) {
          const { sound } = await ExpoAvModule.Audio.Sound.createAsync(
            { uri },
            { shouldPlay: true },
            (status) => {
              if (!status.isLoaded) return;
              const pos = Math.floor((status.positionMillis || 0) / 1000);
              const dur = Math.max(
                1,
                Math.floor((status.durationMillis || (durationSec || 1) * 1000) / 1000)
              );
              setPositionSec(pos);
              setTotalSec(dur);
              setIsPlaying(status.isPlaying);
              if (status.didJustFinish) {
                setIsPlaying(false);
                setPositionSec(0);
                setActiveVoiceId(null);
              }
            }
          );
          avSoundRef.current = sound;
          setIsPlaying(true);
          return;
        }
        await avSoundRef.current.playAsync();
        setIsPlaying(true);
        return;
      } catch (_) {}
    }

    startSimulatedPlayback();
  };

  const progressRatio = Math.min(1, Math.max(0, positionSec / Math.max(1, totalSec)));
  const shownTime =
    isPlaying || positionSec > 0 ? formatDuration(positionSec) : formatDuration(totalSec);

  const trackBg = isMine ? 'rgba(255,255,255,0.28)' : theme.border;
  const fillBg = isMine ? '#ffffff' : theme.accent;

  return (
    <View style={styles.voiceRow}>
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.voicePlayBtn,
          { backgroundColor: isMine ? 'rgba(255,255,255,0.22)' : theme.accentSoft },
        ]}
        onPress={handleTogglePlay}
      >
        <Text
          style={{
            color: isMine ? '#ffffff' : theme.accentText,
            fontWeight: '700',
            fontSize: 13,
          }}
        >
          {isPlaying ? '❚❚' : '▶'}
        </Text>
      </TouchableOpacity>

      <View style={styles.voiceBody}>
        <View style={[styles.voiceProgressTrack, { backgroundColor: trackBg }]}>
          <View
            style={[
              styles.voiceProgressFill,
              {
                backgroundColor: fillBg,
                width: `${Math.round(progressRatio * 100)}%`,
              },
            ]}
          />
        </View>
        <Text
          style={[
            styles.voiceMeta,
            { color: isMine ? 'rgba(255,255,255,0.88)' : theme.textMuted },
          ]}
        >
          Голосовое · {shownTime}
        </Text>
      </View>
    </View>
  );
}

function LoginScreen({ theme, onToggleTheme, onLoggedIn }) {
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const cleanLogin = normalizeId(loginInput);
    const cleanPass = passwordInput.trim();

    if (!cleanLogin || !cleanPass) {
      alert('Введи логин и пароль');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`login.eq.${cleanLogin},user_id.eq.${cleanLogin}`)
      .maybeSingle();
    setLoading(false);

    if (error) {
      alert('Ошибка входа: ' + error.message);
      return;
    }

    if (!data) {
      alert('Логин не найден');
      return;
    }

    if (String(data.password_pin || '') !== cleanPass) {
      alert('Неверный пароль');
      return;
    }

    onLoggedIn(data);
  };

  return (
    <SafeAreaView style={[styles.authScreen, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
      <View style={styles.authTopRow}>
        <TouchableOpacity
          style={[styles.themeChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={onToggleTheme}
        >
          <Text style={[styles.themeChipText, { color: theme.accentText }]}>
            {theme.isDark ? 'Светлая тема' : 'Тёмная тема'}
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.authBox,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.authHeading, { color: theme.text }]}>Вход в закрытый круг</Text>
        <Text style={[styles.authCaption, { color: theme.textMuted }]}>
          Введи логин и пароль. Сессия сохранится, пока ты сама не выйдешь из аккаунта.
        </Text>

        <TextInput
          style={[
            styles.field,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text },
          ]}
          placeholder="Логин или @username"
          placeholderTextColor={theme.textMuted}
          value={loginInput}
          onChangeText={setLoginInput}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={[
            styles.field,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text },
          ]}
          placeholder="Пароль"
          placeholderTextColor={theme.textMuted}
          value={passwordInput}
          onChangeText={setPasswordInput}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.mainButton, { backgroundColor: theme.accent }]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.mainButtonText}>{loading ? 'Входим...' : 'Войти'}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 24 }} />
    </SafeAreaView>
  );
}

function ForceSetupModal({ visible, profile, theme, onCompleted, onCancel }) {
  const [nameInput, setNameInput] = useState('');
  const [newLogin, setNewLogin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && profile) {
      setNameInput(
        profile.display_name && !profile.display_name.startsWith('Участник ')
          ? profile.display_name
          : ''
      );
      setNewLogin('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [visible, profile]);

  const handleSaveSetup = async () => {
    const cleanName = nameInput.trim();
    const cleanLogin = normalizeId(newLogin);
    const p1 = newPassword.trim();
    const p2 = confirmPassword.trim();

    if (!cleanName) {
      alert('Укажи своё имя');
      return;
    }
    if (!cleanLogin || cleanLogin.length < 3) {
      alert('Придумай новый логин (минимум 3 символа)');
      return;
    }
    if (p1.length < 4) {
      alert('Новый пароль должен быть минимум из 4 символов');
      return;
    }
    if (p1 !== p2) {
      alert('Пароли не совпадают');
      return;
    }

    setSaving(true);
    const { data: taken, error: checkErr } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('login', cleanLogin)
      .neq('user_id', profile.user_id)
      .maybeSingle();

    if (checkErr) {
      setSaving(false);
      alert('Ошибка проверки логина: ' + checkErr.message);
      return;
    }

    if (taken) {
      setSaving(false);
      alert('Этот логин уже занят');
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        display_name: cleanName,
        login: cleanLogin,
        password_pin: p1,
        must_change_password: false,
        is_activated: true,
      })
      .eq('user_id', profile.user_id)
      .select('*')
      .single();
    setSaving(false);

    if (error) {
      alert('Не удалось сохранить: ' + error.message);
      return;
    }

    onCompleted(data);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.setupSheet,
            { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 },
          ]}
        >
          <Text style={[styles.setupBadge, { color: theme.accentText }]}>ПЕРВЫЙ ВХОД</Text>
          <Text style={[styles.sheetTitle, { color: theme.text }]}>Настройка аккаунта</Text>
          <Text style={[styles.sheetSub, { color: theme.textMuted }]}>
            Задай имя, постоянный логин и пароль для входа.
          </Text>

          <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Имя</Text>
          <TextInput
            style={[
              styles.field,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text },
            ]}
            placeholder="Твоё имя"
            placeholderTextColor={theme.textMuted}
            value={nameInput}
            onChangeText={setNameInput}
          />

          <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Новый логин</Text>
          <TextInput
            style={[
              styles.field,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text },
            ]}
            placeholder="Например: aruzhan_26"
            placeholderTextColor={theme.textMuted}
            value={newLogin}
            onChangeText={setNewLogin}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Новый пароль</Text>
          <TextInput
            style={[
              styles.field,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text },
            ]}
            placeholder="Придумай пароль"
            placeholderTextColor={theme.textMuted}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />

          <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Повтори пароль</Text>
          <TextInput
            style={[
              styles.field,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text },
            ]}
            placeholder="Повтори пароль"
            placeholderTextColor={theme.textMuted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.mainButton, { backgroundColor: theme.accent }]}
            onPress={handleSaveSetup}
            disabled={saving}
          >
            <Text style={styles.mainButtonText}>{saving ? 'Сохраняем...' : 'Сохранить'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ghostButton} onPress={onCancel}>
            <Text style={[styles.ghostButtonText, { color: theme.textMuted }]}>Выйти</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function MessengerApp({
  initialProfile,
  theme,
  onToggleTheme,
  onProfileUpdated,
  onLogout,
  pinConfig,
  onSavePinConfig,
}) {
  const [profile, setProfile] = useState(initialProfile);
  const [allProfiles, setAllProfiles] = useState([initialProfile]);
  const [allRoomMessages, setAllRoomMessages] = useState([]);

  const [tab, setTab] = useState('chats');
  const [subScreen, setSubScreen] = useState(null);

  const [activeChat, setActiveChat] = useState(null);
  const [inspectedUser, setInspectedUser] = useState(null);
  const [mutedPeers, setMutedPeers] = useState({});
  const [activeCallPeer, setActiveCallPeer] = useState(null);

  const [selectedNoteUser, setSelectedNoteUser] = useState(null);
  const [noteQuickReply, setNoteQuickReply] = useState('');

  const [groups, setGroups] = useState([]);
  const [lastMsgByRoom, setLastMsgByRoom] = useState({});
  const [unreadByRoom, setUnreadByRoom] = useState({});
  const [pinnedListByRoom, setPinnedListByRoom] = useState({});
  const [activePinIndexByRoom, setActivePinIndexByRoom] = useState({});
  const [clearedAfterIdByRoom, setClearedAfterIdByRoom] = useState({});
  const [deletedRooms, setDeletedRooms] = useState({});

  const [roomMenuOpen, setRoomMenuOpen] = useState(false);
  const [chatSearchOpen, setChatSearchOpen] = useState(false);
  const [chatSearchText, setChatSearchText] = useState('');
  const [replyingToMsg, setReplyingToMsg] = useState(null);

  const [chatRowMenuTarget, setChatRowMenuTarget] = useState(null);

  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [groupMembersModalOpen, setGroupMembersModalOpen] = useState(false);

  const [messages, setMessages] = useState([]);
  const [hiddenMsgIds, setHiddenMsgIds] = useState([]);
  const [editingMsg, setEditingMsg] = useState(null);
  const [forwardTargetMsg, setForwardTargetMsg] = useState(null);
  const [text, setText] = useState('');
  const [textSelection, setTextSelection] = useState({ start: 0, end: 0 });
  const listRef = useRef(null);

  const lastTapRef = useRef({ id: null, time: 0 });
  const [actionTargetMsg, setActionTargetMsg] = useState(null);
  const [showMoreEmojis, setShowMoreEmojis] = useState(false);
  const [msgReactions, setMsgReactions] = useState({});
  const [activeVoiceId, setActiveVoiceId] = useState(null);

  const [galleryState, setGalleryState] = useState({
    visible: false,
    photos: [],
    index: 0,
  });

  const audioRecorderRef = useRef(null);
  const avRecordingRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');

  const [noteText, setNoteText] = useState(initialProfile.note_text || '');
  const [noteEmoji, setNoteEmoji] = useState(initialProfile.note_emoji || '💜');
  const [noteSticker, setNoteSticker] = useState(initialProfile.note_sticker || STICKER_PACK[0].emoji);
  const [reactions, setReactions] = useState([]);

  const [editName, setEditName] = useState(initialProfile.display_name || '');
  const [editBio, setEditBio] = useState(initialProfile.bio || '');
  const [editLogin, setEditLogin] = useState(initialProfile.login || '');
  const [editPhone, setEditPhone] = useState(initialProfile.phone || '');
  const [hiddenIdsText, setHiddenIdsText] = useState(
    (initialProfile.note_hidden_from || []).join(', ')
  );

  const [pinEnabledDraft, setPinEnabledDraft] = useState(Boolean(pinConfig?.enabled));
  const [pinCodeDraft, setPinCodeDraft] = useState(cleanPinDigits(pinConfig?.pin || ''));

  const [inviteLogin, setInviteLogin] = useState('');
  const [inviteTempPass, setInviteTempPass] = useState(generateTempPass());
  const [createdInviteInfo, setCreatedInviteInfo] = useState('');

  const myId = normalizeId(profile.user_id);

  const currentGroup =
    activeChat?.type === 'group' && activeChat.group
      ? groups.find((g) => g.id === activeChat.group.id) || activeChat.group
      : null;

  const activeRoomId =
    activeChat?.type === 'self'
      ? makeRoomId(myId, myId)
      : activeChat?.type === 'peer' && activeChat.peer
      ? makeRoomId(myId, normalizeId(activeChat.peer.user_id))
      : activeChat?.type === 'group' && currentGroup
      ? makeGroupRoomId(currentGroup.id)
      : '';

  const archivedIds = (profile.archived_peers || []).map((x) => normalizeId(x));

  useEffect(() => {
    setProfile(initialProfile);
    setEditName(initialProfile.display_name || '');
    setEditLogin(initialProfile.login || '');
    setEditBio(initialProfile.bio || '');
    setEditPhone(initialProfile.phone || '');
    setNoteText(initialProfile.note_text || '');
    setNoteEmoji(initialProfile.note_emoji || '💜');
    setNoteSticker(initialProfile.note_sticker || STICKER_PACK[0].emoji);
  }, [initialProfile]);

  useEffect(() => {
    setPinEnabledDraft(Boolean(pinConfig?.enabled));
    setPinCodeDraft(cleanPinDigits(pinConfig?.pin || ''));
  }, [pinConfig]);

  useEffect(() => {
    if (!profile.is_activated) return;

    loadProfiles();
    loadReactions();
    loadGroupsAndRoomMeta();

    const interval = setInterval(() => {
      loadProfiles();
      loadGroupsAndRoomMeta();
    }, 25000);

    const profilesSub = supabase
      .channel('v15:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadProfiles();
      })
      .subscribe();

    const reactionsSub = supabase
      .channel('v15:reactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'note_reactions' }, () => {
        loadReactions();
      })
      .subscribe();

    const roomMetaSub = supabase
      .channel('v15:all_messages_meta')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        loadGroupsAndRoomMeta();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(profilesSub);
      supabase.removeChannel(reactionsSub);
      supabase.removeChannel(roomMetaSub);
    };
  }, [profile.user_id, profile.is_activated, activeRoomId]);

  useEffect(() => {
    if (!activeRoomId) return;
    loadMessagesAndMarkRead(activeRoomId);

    const msgSub = supabase
      .channel(`v15:msgs:${activeRoomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          const row = payload.new || payload.old;
          if (row && row.room_id === activeRoomId) {
            loadMessagesAndMarkRead(activeRoomId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgSub);
    };
  }, [activeRoomId, profile.hide_read_receipts, activeChat?.type]);

  useEffect(() => {
    if (messages.length > 0 && subScreen === 'room' && !chatSearchText.trim()) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 120);
    }
  }, [messages, subScreen]);

  useEffect(() => {
    if (subScreen !== 'room') return;
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => {
          listRef.current?.scrollToEnd({ animated: true });
        }, 80);
      }
    );
    return () => showSub.remove();
  }, [subScreen]);

  useEffect(() => {
    if (!isRecording) {
      setRecordSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setRecordSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isRecording]);

  const loadProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*').order('id', { ascending: true });
    if (data && data.length > 0) {
      setAllProfiles(data);
      const freshMe = data.find((p) => normalizeId(p.user_id) === myId);
      if (freshMe) {
        const mergedMe = {
          ...profile,
          ...freshMe,
          phone: freshMe.phone || profile.phone || '',
        };
        setProfile(mergedMe);
        onProfileUpdated(mergedMe);
      }
    }
  };

  const loadReactions = async () => {
    const { data } = await supabase
      .from('note_reactions')
      .select('*')
      .order('id', { ascending: false });
    if (data) setReactions(data);
  };

  const loadGroupsAndRoomMeta = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('id', { ascending: true });

    if (!data) return;

    setAllRoomMessages(data);

    const mapById = new Map();
    const roomLastMap = {};
    const unreadMap = {};
    const pinsMap = {};
    const clearMap = {};
    const delMap = {};

    for (const row of data) {
      if (row.room_id === 'groups_registry') {
        const parsed = parseRichBody(row.body);
        if (parsed.kind === 'group_meta' && parsed.meta?.groupId) {
          if (parsed.meta.deleted) {
            mapById.delete(parsed.meta.groupId);
          } else {
            const grpObj = {
              id: parsed.meta.groupId,
              title: parsed.meta.title || 'Группа',
              description: parsed.meta.description || '',
              members: Array.isArray(parsed.meta.members)
                ? parsed.meta.members.map((x) => normalizeId(x))
                : [],
              admins: Array.isArray(parsed.meta.admins)
                ? parsed.meta.admins.map((x) => normalizeId(x))
                : [],
              pinnedMessageIds: Array.isArray(parsed.meta.pinnedMessageIds)
                ? parsed.meta.pinnedMessageIds
                : parsed.meta.pinnedMessageId
                ? [parsed.meta.pinnedMessageId]
                : [],
            };
            mapById.set(parsed.meta.groupId, grpObj);
            if (grpObj.pinnedMessageIds.length > 0) {
              pinsMap[makeGroupRoomId(grpObj.id)] = grpObj.pinnedMessageIds;
            }
          }
        }
        continue;
      }

      if (row.room_id === `user_prefs__${myId}`) {
        try {
          const pref = JSON.parse(row.body);
          if (pref?.kind === 'pin_list' && pref.targetRoomId) {
            pinsMap[pref.targetRoomId] = Array.isArray(pref.pinnedIds) ? pref.pinnedIds : [];
          } else if (pref?.kind === 'clear_room' && pref.targetRoomId) {
            clearMap[pref.targetRoomId] = Number(pref.afterId || 0);
          } else if (pref?.kind === 'delete_room' && pref.targetRoomId) {
            delMap[pref.targetRoomId] = Boolean(pref.deleted);
            if (pref.deleted && pref.afterId) {
              clearMap[pref.targetRoomId] = Number(pref.afterId);
            }
          }
        } catch (_) {}
        continue;
      }

      if (row.room_id) {
        const clearBound = clearMap[row.room_id] || 0;
        if (Number(row.id) > clearBound) {
          roomLastMap[row.room_id] = row;
          const fromOther = normalizeId(row.sender_id) !== myId;
          const isCurrentOpenRoom = subScreen === 'room' && row.room_id === activeRoomId;
          if (fromOther && !isCurrentOpenRoom && !row.read_at) {
            unreadMap[row.room_id] = (unreadMap[row.room_id] || 0) + 1;
          }
        }
      }
    }

    setGroups(Array.from(mapById.values()));
    setLastMsgByRoom(roomLastMap);
    setUnreadByRoom(unreadMap);
    setPinnedListByRoom(pinsMap);
    setClearedAfterIdByRoom(clearMap);
    setDeletedRooms(delMap);
  };

  const saveUserPrefEvent = async (prefObj) => {
    await supabase.from('messages').insert([
      {
        sender: profile.display_name,
        sender_id: myId,
        recipient_id: myId,
        room_id: `user_prefs__${myId}`,
        body: JSON.stringify(prefObj),
      },
    ]);
  };

  const syncGroupRegistry = async (groupObj, deleted = false) => {
    const payload = JSON.stringify({
      kind: 'group_meta',
      groupId: groupObj.id,
      title: groupObj.title,
      description: groupObj.description || '',
      members: groupObj.members,
      admins: groupObj.admins,
      pinnedMessageIds: groupObj.pinnedMessageIds || [],
      deleted,
    });

    await supabase.from('messages').insert([
      {
        sender: profile.display_name,
        sender_id: myId,
        recipient_id: 'groups',
        room_id: 'groups_registry',
        body: payload,
      },
    ]);
    await loadGroupsAndRoomMeta();
  };

  const togglePinMessage = async (msgId) => {
    if (!activeRoomId) return;
    setActionTargetMsg(null);

    if (activeChat?.type === 'group' && currentGroup) {
      const existing = currentGroup.pinnedMessageIds || [];
      const nextPins = existing.some((x) => String(x) === String(msgId))
        ? existing.filter((x) => String(x) !== String(msgId))
        : [...existing, msgId];
      const updated = { ...currentGroup, pinnedMessageIds: nextPins };
      setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      setActiveChat({ type: 'group', group: updated });
      setPinnedListByRoom((prev) => ({ ...prev, [activeRoomId]: nextPins }));
      await syncGroupRegistry(updated, false);
      return;
    }

    const existing = pinnedListByRoom[activeRoomId] || [];
    const nextPins = existing.some((x) => String(x) === String(msgId))
      ? existing.filter((x) => String(x) !== String(msgId))
      : [...existing, msgId];

    setPinnedListByRoom((prev) => ({ ...prev, [activeRoomId]: nextPins }));
    setActivePinIndexByRoom((prev) => ({ ...prev, [activeRoomId]: 0 }));
    await saveUserPrefEvent({
      kind: 'pin_list',
      targetRoomId: activeRoomId,
      pinnedIds: nextPins,
    });
  };

  const clearRoomForMe = async (roomId, currentRoomMessages = []) => {
    const maxId =
      currentRoomMessages.length > 0
        ? Math.max(...currentRoomMessages.map((m) => Number(m.id) || 0))
        : Number(lastMsgByRoom[roomId]?.id || 0);

    setClearedAfterIdByRoom((prev) => ({ ...prev, [roomId]: maxId }));
    setPinnedListByRoom((prev) => ({ ...prev, [roomId]: [] }));
    if (roomId === activeRoomId) {
      setMessages([]);
    } else {
      setLastMsgByRoom((prev) => {
        const copy = { ...prev };
        delete copy[roomId];
        return copy;
      });
    }
    await saveUserPrefEvent({
      kind: 'clear_room',
      targetRoomId: roomId,
      afterId: maxId,
    });
  };

  const deleteRoomForMe = async (roomId) => {
    const maxId = Number(lastMsgByRoom[roomId]?.id || 0);
    setDeletedRooms((prev) => ({ ...prev, [roomId]: true }));
    setClearedAfterIdByRoom((prev) => ({ ...prev, [roomId]: maxId }));
    setLastMsgByRoom((prev) => {
      const copy = { ...prev };
      delete copy[roomId];
      return copy;
    });
    if (roomId === activeRoomId) {
      setSubScreen(null);
      setActiveChat(null);
      setMessages([]);
    }
    await saveUserPrefEvent({
      kind: 'delete_room',
      targetRoomId: roomId,
      deleted: true,
      afterId: maxId,
    });
  };

  const loadMessagesAndMarkRead = async (roomId) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('id', { ascending: true });

    if (data) {
      const clearBound = clearedAfterIdByRoom[roomId] || 0;
      const filteredByClear = data.filter((m) => Number(m.id) > clearBound);
      setMessages(filteredByClear);

      if (filteredByClear.length > 0) {
        setLastMsgByRoom((prev) => ({
          ...prev,
          [roomId]: filteredByClear[filteredByClear.length - 1],
        }));
      }
      setUnreadByRoom((prev) => ({
        ...prev,
        [roomId]: 0,
      }));

      if (activeChat?.type === 'peer' && !profile.hide_read_receipts) {
        const unreadFromOthers = filteredByClear.filter(
          (m) => normalizeId(m.sender_id) !== myId && !m.read_at
        );
        if (unreadFromOthers.length > 0) {
          const ids = unreadFromOthers.map((m) => m.id);
          await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .in('id', ids);
        }
      }
    }
  };

  const openSelfChat = async () => {
    setEditingMsg(null);
    setReplyingToMsg(null);
    setRoomMenuOpen(false);
    setChatSearchOpen(false);
    setChatSearchText('');
    const rId = makeRoomId(myId, myId);
    setDeletedRooms((prev) => ({ ...prev, [rId]: false }));
    setUnreadByRoom((prev) => ({ ...prev, [rId]: 0 }));
    await saveUserPrefEvent({ kind: 'delete_room', targetRoomId: rId, deleted: false });
    setActiveChat({ type: 'self' });
    setSubScreen('room');
    setTab('chats');
  };

  const openPeerChat = async (peer) => {
    setEditingMsg(null);
    setReplyingToMsg(null);
    setRoomMenuOpen(false);
    setChatSearchOpen(false);
    setChatSearchText('');
    const rId = makeRoomId(myId, normalizeId(peer.user_id));
    setDeletedRooms((prev) => ({ ...prev, [rId]: false }));
    setUnreadByRoom((prev) => ({ ...prev, [rId]: 0 }));
    await saveUserPrefEvent({ kind: 'delete_room', targetRoomId: rId, deleted: false });
    setActiveChat({ type: 'peer', peer });
    setSubScreen('room');
    setTab('chats');
  };

  const openGroupChat = async (group) => {
    setEditingMsg(null);
    setReplyingToMsg(null);
    setRoomMenuOpen(false);
    setChatSearchOpen(false);
    setChatSearchText('');
    const rId = makeGroupRoomId(group.id);
    setDeletedRooms((prev) => ({ ...prev, [rId]: false }));
    setUnreadByRoom((prev) => ({ ...prev, [rId]: 0 }));
    await saveUserPrefEvent({ kind: 'delete_room', targetRoomId: rId, deleted: false });
    setActiveChat({ type: 'group', group });
    setSubScreen('room');
    setTab('chats');
  };

  const startCallToUser = (targetUser) => {
    if (!targetUser) return;
    const rawPhone = (targetUser.phone || '').trim();
    if (rawPhone) {
      const telUrl = `tel:${rawPhone.replace(/[^\d+]/g, '')}`;
      Linking.openURL(telUrl).catch(() => {
        setActiveCallPeer(targetUser);
      });
      return;
    }
    setActiveCallPeer(targetUser);
  };

  const handleCreateGroup = async () => {
    const cleanTitle = newGroupTitle.trim();
    if (!cleanTitle) {
      alert('Введи название группы');
      return;
    }

    const memberSet = new Set([myId, ...selectedGroupMembers.map((x) => normalizeId(x))]);
    const newGroup = {
      id: `grp_${Date.now()}`,
      title: cleanTitle,
      description: newGroupDesc.trim(),
      members: Array.from(memberSet),
      admins: [myId],
      pinnedMessageIds: [],
    };

    setGroups((prev) => [...prev, newGroup]);
    setNewGroupTitle('');
    setNewGroupDesc('');
    setSelectedGroupMembers([]);
    setCreateGroupOpen(false);

    await syncGroupRegistry(newGroup, false);
    openGroupChat(newGroup);
  };

  const toggleGroupAdmin = async (targetUserId) => {
    if (!currentGroup) return;
    const cleanTarget = normalizeId(targetUserId);
    if (!currentGroup.admins.includes(myId)) {
      alert('Только администратор может менять права админов');
      return;
    }
    if (cleanTarget === myId && currentGroup.admins.length === 1) {
      alert('В группе должен оставаться хотя бы один администратор');
      return;
    }

    const nextAdmins = currentGroup.admins.includes(cleanTarget)
      ? currentGroup.admins.filter((id) => id !== cleanTarget)
      : [...currentGroup.admins, cleanTarget];

    const updated = { ...currentGroup, admins: nextAdmins };
    setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    setActiveChat({ type: 'group', group: updated });
    await syncGroupRegistry(updated, false);
  };

  const toggleGroupMember = async (targetUserId) => {
    if (!currentGroup) return;
    const cleanTarget = normalizeId(targetUserId);
    if (!currentGroup.admins.includes(myId)) {
      alert('Только администратор может добавлять и удалять участников');
      return;
    }
    if (cleanTarget === myId) return;

    const isMember = currentGroup.members.includes(cleanTarget);
    const nextMembers = isMember
      ? currentGroup.members.filter((id) => id !== cleanTarget)
      : [...currentGroup.members, cleanTarget];
    const nextAdmins = currentGroup.admins.filter((id) => nextMembers.includes(id));

    const updated = { ...currentGroup, members: nextMembers, admins: nextAdmins };
    setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    setActiveChat({ type: 'group', group: updated });
    await syncGroupRegistry(updated, false);
  };

  const leaveCurrentGroup = async () => {
    if (!currentGroup) return;
    const nextMembers = currentGroup.members.filter((id) => id !== myId);
    let nextAdmins = currentGroup.admins.filter((id) => id !== myId);
    if (nextMembers.length > 0 && nextAdmins.length === 0) {
      nextAdmins = [nextMembers[0]];
    }

    setGroupMembersModalOpen(false);
    setSubScreen(null);
    setActiveChat(null);

    if (nextMembers.length === 0) {
      setGroups((prev) => prev.filter((g) => g.id !== currentGroup.id));
      await syncGroupRegistry(currentGroup, true);
    } else {
      const updated = { ...currentGroup, members: nextMembers, admins: nextAdmins };
      setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      await syncGroupRegistry(updated, false);
    }
  };

  const deleteCurrentGroup = async () => {
    if (!currentGroup || !currentGroup.admins.includes(myId)) return;
    const target = currentGroup;
    setGroupMembersModalOpen(false);
    setSubScreen(null);
    setActiveChat(null);
    setGroups((prev) => prev.filter((g) => g.id !== target.id));
    await syncGroupRegistry(target, true);
  };

  const toggleArchivePeer = async (targetUserId) => {
    const cleanTarget = normalizeId(targetUserId);
    const exists = archivedIds.includes(cleanTarget);
    const nextList = exists
      ? archivedIds.filter((id) => id !== cleanTarget)
      : [...archivedIds, cleanTarget];

    setProfile((prev) => ({ ...prev, archived_peers: nextList }));
    await supabase
      .from('profiles')
      .update({ archived_peers: nextList })
      .eq('user_id', profile.user_id);
  };

  const applySpoilerToInput = () => {
    const start = Math.min(textSelection.start, textSelection.end);
    const end = Math.max(textSelection.start, textSelection.end);

    if (end > start && text.length >= end) {
      const selectedPart = text.slice(start, end);
      const wrapped = `||${selectedPart}||`;
      const next = text.slice(0, start) + wrapped + text.slice(end);
      setText(next);
      return;
    }

    if (text.trim().length > 0) {
      setText(`||${text.trim()}||`);
      return;
    }

    setText((prev) => `${prev}||скрытый текст||`);
  };

  const buildReplySnapshot = () => {
    if (!replyingToMsg) return null;
    return {
      id: replyingToMsg.id,
      sender: replyingToMsg.sender || 'Участник',
      preview: getPreviewLabel(replyingToMsg.body),
    };
  };

  const insertMessageBodyToRoom = async (targetRoomId, targetRecipientId, bodyContent) => {
    if (!targetRoomId) return false;
    setDeletedRooms((prev) => ({ ...prev, [targetRoomId]: false }));
    const { error } = await supabase.from('messages').insert([
      {
        sender: profile.display_name,
        sender_id: myId,
        recipient_id: targetRecipientId,
        room_id: targetRoomId,
        body: bodyContent,
      },
    ]);

    if (error) {
      alert('Ошибка отправки: ' + error.message);
      return false;
    }
    return true;
  };

  const insertMessageBody = async (bodyContent, attachReply = true) => {
    if (!activeRoomId) return false;
    const recipient =
      activeChat?.type === 'self'
        ? myId
        : activeChat?.type === 'peer'
        ? normalizeId(activeChat.peer.user_id)
        : currentGroup?.id || 'group';

    const replySnap = attachReply ? buildReplySnapshot() : null;
    let finalBody = bodyContent;

    if (replySnap) {
      const parsed = parseRichBody(bodyContent);
      finalBody = JSON.stringify({
        kind: parsed.kind === 'text' ? 'text' : parsed.kind,
        text: parsed.text,
        uri: parsed.meta?.uri,
        caption: parsed.meta?.caption,
        name: parsed.meta?.name,
        ext: parsed.meta?.ext,
        duration: parsed.meta?.duration,
        replyTo: replySnap,
      });
    }

    return insertMessageBodyToRoom(activeRoomId, recipient, finalBody);
  };

  const forwardMessageToDestination = async (dest) => {
    if (!forwardTargetMsg) return;
    const parsed = parseRichBody(forwardTargetMsg.body);
    const authorLabel = forwardTargetMsg.sender || 'Участник';

    let payloadBody = '';
    if (parsed.kind === 'image' && parsed.meta?.uri) {
      payloadBody = JSON.stringify({
        kind: 'image',
        uri: parsed.meta.uri,
        caption: parsed.text || '',
        forwardedFrom: authorLabel,
      });
    } else if (parsed.kind === 'file') {
      payloadBody = JSON.stringify({
        kind: 'file',
        name: parsed.text,
        ext: parsed.meta?.ext || '',
        uri: parsed.meta?.uri || '',
        forwardedFrom: authorLabel,
      });
    } else if (parsed.kind === 'voice') {
      payloadBody = JSON.stringify({
        kind: 'voice',
        uri: parsed.meta?.uri || '',
        duration: parsed.meta?.duration || 1,
        forwardedFrom: authorLabel,
      });
    } else {
      payloadBody = JSON.stringify({
        kind: 'text',
        text: parsed.text,
        forwardedFrom: authorLabel,
      });
    }

    const ok = await insertMessageBodyToRoom(dest.roomId, dest.recipientId, payloadBody);
    setForwardTargetMsg(null);

    if (ok && dest.roomId === activeRoomId) {
      loadMessagesAndMarkRead(activeRoomId);
    } else if (ok) {
      alert(`Переслано в чат «${dest.title}»`);
    }
  };

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || !activeRoomId) return;

    if (editingMsg) {
      const targetId = editingMsg.id;
      const oldParsed = parseRichBody(editingMsg.body);
      const nextBody =
        oldParsed.forwardedFrom || oldParsed.replyTo
          ? JSON.stringify({
              kind: 'text',
              text: trimmed,
              forwardedFrom: oldParsed.forwardedFrom,
              replyTo: oldParsed.replyTo,
            })
          : trimmed;
      setEditingMsg(null);
      setText('');
      setMessages((prev) =>
        prev.map((m) => (m.id === targetId ? { ...m, body: nextBody } : m))
      );
      await supabase.from('messages').update({ body: nextBody }).eq('id', targetId);
      return;
    }

    const ok = await insertMessageBody(trimmed, true);
    if (ok) {
      setText('');
      setReplyingToMsg(null);
      setTextSelection({ start: 0, end: 0 });
    }
  };

  const pickPhotoForChat = async () => {
    if (!activeRoomId) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      if (perm.canAskAgain === false) {
        Linking.openSettings();
      } else {
        alert('Разреши доступ к галерее');
      }
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.75,
    });

    if (!res.canceled && res.assets?.[0]?.uri) {
      const payload = JSON.stringify({
        kind: 'image',
        uri: res.assets[0].uri,
        caption: text.trim(),
      });
      const ok = await insertMessageBody(payload, true);
      if (ok) {
        setText('');
        setReplyingToMsg(null);
      }
    }
  };

  const pickFileForChat = async () => {
    if (!activeRoomId) return;
    try {
      if (DocumentPickerModule && DocumentPickerModule.getDocumentAsync) {
        const res = await DocumentPickerModule.getDocumentAsync({
          type: ['image/*', 'audio/*', 'video/*', 'application/pdf', '*/*'],
          copyToCacheDirectory: true,
        });

        const asset = res?.assets?.[0] || (!res?.canceled ? res : null);
        if (asset && (asset.uri || asset.name)) {
          const fileName = asset.name || 'document';
          const ext = fileName.split('.').pop()?.toLowerCase() || '';
          if (['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext) && asset.uri) {
            await insertMessageBody(
              JSON.stringify({ kind: 'image', uri: asset.uri, caption: '' }),
              true
            );
            setReplyingToMsg(null);
            return;
          }
          await insertMessageBody(
            JSON.stringify({
              kind: 'file',
              name: fileName,
              ext,
              uri: asset.uri || '',
            }),
            true
          );
          setReplyingToMsg(null);
          return;
        }
      } else {
        await pickPhotoForChat();
      }
    } catch (e) {
      alert('Не удалось выбрать файл: ' + e.message);
    }
  };

  const startVoiceRecording = async () => {
    if (!activeRoomId) return;

    if (ExpoAudioModule && typeof ExpoAudioModule.requestRecordingPermissionsAsync === 'function') {
      try {
        const perm = await ExpoAudioModule.requestRecordingPermissionsAsync();
        if (perm.granted && typeof ExpoAudioModule.AudioRecorder === 'function') {
          if (typeof ExpoAudioModule.setAudioModeAsync === 'function') {
            await ExpoAudioModule.setAudioModeAsync({
              allowsRecording: true,
              playsInSilentMode: true,
            });
          }
          const rec = new ExpoAudioModule.AudioRecorder(
            ExpoAudioModule.RecordingPresets?.HIGH_QUALITY || {
              extension: '.m4a',
              sampleRate: 44100,
              numberOfChannels: 1,
              bitRate: 128000,
            }
          );
          await rec.prepareToRecordAsync();
          rec.record();
          audioRecorderRef.current = rec;
          setRecordSeconds(0);
          setIsRecording(true);
          return;
        }
      } catch (_) {}
    }

    if (ExpoAvModule && ExpoAvModule.Audio) {
      try {
        const perm = await ExpoAvModule.Audio.requestPermissionsAsync();
        if (perm.granted) {
          await ExpoAvModule.Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
          });
          const { recording } = await ExpoAvModule.Audio.Recording.createAsync(
            ExpoAvModule.Audio.RecordingOptionsPresets.HIGH_QUALITY
          );
          avRecordingRef.current = recording;
          setRecordSeconds(0);
          setIsRecording(true);
          return;
        }
      } catch (_) {}
    }

    setRecordSeconds(0);
    setIsRecording(true);
  };

  const stopAndSendVoiceRecording = async () => {
    const durationSec = Math.max(1, recordSeconds);
    setIsRecording(false);
    let uri = null;
    let finalSec = durationSec;

    if (audioRecorderRef.current) {
      const rec = audioRecorderRef.current;
      audioRecorderRef.current = null;
      try {
        await rec.stop();
        uri = rec.uri || null;
      } catch (_) {}
    } else if (avRecordingRef.current) {
      const rec = avRecordingRef.current;
      avRecordingRef.current = null;
      try {
        const st = await rec.getStatusAsync();
        finalSec = Math.max(1, Math.round((st.durationMillis || durationSec * 1000) / 1000));
        await rec.stopAndUnloadAsync();
        uri = rec.getURI();
      } catch (_) {}
    }

    await insertMessageBody(
      JSON.stringify({
        kind: 'voice',
        uri: uri || `local_voice_${Date.now()}.m4a`,
        duration: finalSec,
      }),
      true
    );
    setReplyingToMsg(null);
  };

  const toggleMessageReaction = (msgId, emoji) => {
    setMsgReactions((prev) => {
      const list = prev[msgId] || [];
      const exists = list.some((r) => r.userId === myId && r.emoji === emoji);
      const filtered = list.filter((r) => !(r.userId === myId && r.emoji === emoji));
      return {
        ...prev,
        [msgId]: exists ? filtered : [...filtered, { userId: myId, emoji }],
      };
    });
  };

  const handleMessagePress = (item) => {
    const now = Date.now();
    const isDoubleTap =
      lastTapRef.current.id === item.id && now - lastTapRef.current.time < 320;
    lastTapRef.current = { id: item.id, time: now };

    if (isDoubleTap) {
      toggleMessageReaction(item.id, '❤️');
      return;
    }

    const parsed = parseRichBody(item.body);
    if (parsed.kind === 'image' && parsed.meta?.uri) {
      const vis = messages.filter((m) => !hiddenMsgIds.includes(m.id));
      const photoItems = vis
        .map((m) => ({ msg: m, parsed: parseRichBody(m.body) }))
        .filter((x) => x.parsed.kind === 'image' && x.parsed.meta?.uri);
      const idx = photoItems.findIndex((x) => x.msg.id === item.id);
      setGalleryState({
        visible: true,
        photos: photoItems.map((x) => ({
          uri: x.parsed.meta.uri,
          caption: x.parsed.text || '',
          sender: x.msg.sender,
          time: formatTime(x.msg.created_at),
        })),
        index: idx >= 0 ? idx : 0,
      });
    }
  };

  const openMessageMenu = (item) => {
    setShowMoreEmojis(false);
    setActionTargetMsg(item);
  };

  const startEditingMessage = (item) => {
    const parsed = parseRichBody(item.body);
    setActionTargetMsg(null);
    if (parsed.kind === 'text') {
      setEditingMsg(item);
      setText(parsed.text);
    }
  };

  const deleteMessageForMe = (msgId) => {
    setHiddenMsgIds((prev) => (prev.includes(msgId) ? prev : [...prev, msgId]));
    setActionTargetMsg(null);
  };

  const deleteMessageForEveryone = async (msgId) => {
    setActionTargetMsg(null);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    const { error } = await supabase.from('messages').delete().eq('id', msgId);
    if (error && activeRoomId) {
      loadMessagesAndMarkRead(activeRoomId);
    }
  };

  const saveMyNote = async (overrideText) => {
    const cleanNote = (overrideText !== undefined ? overrideText : noteText).trim();
    const { error } = await supabase
      .from('profiles')
      .update({
        note_text: cleanNote,
        note_emoji: cleanNote ? noteEmoji : null,
        note_sticker: cleanNote ? noteSticker : null,
        note_updated_at: new Date().toISOString(),
      })
      .eq('user_id', profile.user_id);

    if (error) {
      alert('Ошибка сохранения заметки: ' + error.message);
      return;
    }
    setNoteText(cleanNote);
    alert(cleanNote ? 'Заметка опубликована' : 'Заметка убрана');
    loadProfiles();
  };

  const sendNoteReaction = async (targetUserId, emoji) => {
    const { error } = await supabase.from('note_reactions').insert([
      {
        target_user_id: normalizeId(targetUserId),
        reactor_id: myId,
        emoji,
      },
    ]);
    if (!error) loadReactions();
  };

  const sendNoteReply = async () => {
    if (!selectedNoteUser || !noteQuickReply.trim()) return;
    const targetId = normalizeId(selectedNoteUser.user_id);
    const trimmed = noteQuickReply.trim();

    await supabase.from('messages').insert([
      {
        sender: profile.display_name,
        sender_id: myId,
        recipient_id: targetId,
        room_id: makeRoomId(myId, targetId),
        body: `На заметку «${selectedNoteUser.note_text || ''}»: ${trimmed}`,
      },
    ]);

    setNoteQuickReply('');
    const peerObj = selectedNoteUser;
    setSelectedNoteUser(null);
    openPeerChat(peerObj);
  };

  const pickAvatarFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      if (perm.canAskAgain === false) {
        Linking.openSettings();
      } else {
        alert('Разреши доступ к галерее');
      }
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    });

    if (!res.canceled && res.assets?.[0]?.uri) {
      const uri = res.assets[0].uri;
      setProfile((prev) => ({ ...prev, avatar_url: uri }));
      await supabase
        .from('profiles')
        .update({ avatar_url: uri })
        .eq('user_id', profile.user_id);
    }
  };

  const removeAvatarPhoto = async () => {
    if (!profile.avatar_url) return;
    setProfile((prev) => ({ ...prev, avatar_url: null }));
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('user_id', profile.user_id);
    if (error) {
      alert('Не удалось удалить фото: ' + error.message);
      loadProfiles();
    }
  };

  const saveProfileAndPrivacy = async () => {
    const cleanLogin = normalizeId(editLogin) || profile.login;
    const cleanPhone = editPhone.trim();
    const hiddenList = hiddenIdsText
      .split(',')
      .map((s) => normalizeId(s))
      .filter(Boolean);

    const nextLocalProfile = {
      ...profile,
      display_name: editName.trim() || profile.display_name,
      login: cleanLogin,
      bio: editBio.trim(),
      phone: cleanPhone,
      note_hidden_from: hiddenList,
    };

    setProfile(nextLocalProfile);
    onProfileUpdated(nextLocalProfile);

    const payload = {
      display_name: nextLocalProfile.display_name,
      login: cleanLogin,
      bio: nextLocalProfile.bio,
      note_hidden_from: hiddenList,
    };

    if (cleanPhone) {
      payload.phone = cleanPhone;
    }

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('user_id', profile.user_id);

    if (error && payload.phone !== undefined) {
      delete payload.phone;
      const retry = await supabase
        .from('profiles')
        .update(payload)
        .eq('user_id', profile.user_id);
      if (retry.error) {
        alert('Ошибка сохранения: ' + retry.error.message);
        return;
      }
    } else if (error) {
      alert('Ошибка сохранения: ' + error.message);
      return;
    }

    alert('Настройки сохранены');
    loadProfiles();
  };

  const handleSavePinSettings = async () => {
    const cleanPin = cleanPinDigits(pinCodeDraft);
    if (pinEnabledDraft && cleanPin.length !== 4) {
      alert('Введи 4-значный PIN-код (4 цифры)');
      return;
    }

    const nextConfig = {
      enabled: Boolean(pinEnabledDraft),
      pin: cleanPin,
    };

    setPinCodeDraft(cleanPin);
    await onSavePinConfig(nextConfig);
    alert(
      nextConfig.enabled
        ? `PIN-код ${cleanPin} сохранён и включён`
        : 'Использование PIN-кода выключено'
    );
  };

  const togglePrivacyFlag = async (field) => {
    const nextVal = !Boolean(profile[field]);
    const updated = { ...profile, [field]: nextVal };
    setProfile(updated);
    onProfileUpdated(updated);
    await supabase
      .from('profiles')
      .update({ [field]: nextVal })
      .eq('user_id', profile.user_id);
  };

  const createInviteCredentials = async () => {
    const cleanLogin = normalizeId(inviteLogin);
    const cleanTemp = inviteTempPass.trim() || generateTempPass();
    if (!cleanLogin) {
      alert('Введи логин');
      return;
    }

    const newUserId = generateUniqueId();
    const { error } = await supabase.from('profiles').insert([
      {
        user_id: newUserId,
        login: cleanLogin,
        password_pin: cleanTemp,
        display_name: 'Участник',
        must_change_password: true,
        is_activated: false,
      },
    ]);

    if (error) {
      alert('Ошибка создания: ' + error.message);
      return;
    }

    setCreatedInviteInfo(
      `Логин: @${cleanLogin}\nОдноразовый пароль: ${cleanTemp}\nID: @${newUserId}`
    );
    setInviteLogin('');
    setInviteTempPass(generateTempPass());
    loadProfiles();
  };

  const otherUsers = allProfiles.filter((u) => normalizeId(u.user_id) !== myId);
  const activatedPeers = otherUsers.filter((u) => Boolean(u.is_activated));
  const pendingInvites = otherUsers.filter((u) => !Boolean(u.is_activated));

  const myGroups = groups.filter(
    (g) => g.members.includes(myId) && !deletedRooms[makeGroupRoomId(g.id)]
  );
  const isCurrentUserGroupAdmin = currentGroup ? currentGroup.admins.includes(myId) : false;

  const roomPinnedIds =
    activeChat?.type === 'group' && currentGroup
      ? currentGroup.pinnedMessageIds || pinnedListByRoom[activeRoomId] || []
      : pinnedListByRoom[activeRoomId] || [];

  const pinnedMessagesList = useMemo(() => {
    return roomPinnedIds
      .map((pid) => messages.find((m) => String(m.id) === String(pid)))
      .filter(Boolean);
  }, [roomPinnedIds, messages]);

  const rawPinIdx = activePinIndexByRoom[activeRoomId] || 0;
  const safePinIdx =
    pinnedMessagesList.length > 0 ? rawPinIdx % pinnedMessagesList.length : 0;
  const activePinnedMsg = pinnedMessagesList[safePinIdx] || null;

  const selfRoomId = makeRoomId(myId, myId);
  const selfLastMsg = !deletedRooms[selfRoomId] ? lastMsgByRoom[selfRoomId] || null : null;
  const hasWrittenToSelf = Boolean(selfLastMsg);

  const mainChats = activatedPeers.filter((u) => {
    const pid = normalizeId(u.user_id);
    const rId = makeRoomId(myId, pid);
    return !archivedIds.includes(pid) && !deletedRooms[rId];
  });

  const archivedChats = activatedPeers.filter((u) => {
    const pid = normalizeId(u.user_id);
    const rId = makeRoomId(myId, pid);
    return archivedIds.includes(pid) && !deletedRooms[rId];
  });

  const sortedMainChats = useMemo(() => {
    return [...mainChats].sort((a, b) => {
      const roomA = makeRoomId(myId, normalizeId(a.user_id));
      const roomB = makeRoomId(myId, normalizeId(b.user_id));
      const timeA = lastMsgByRoom[roomA]?.created_at
        ? new Date(lastMsgByRoom[roomA].created_at).getTime()
        : 0;
      const timeB = lastMsgByRoom[roomB]?.created_at
        ? new Date(lastMsgByRoom[roomB].created_at).getTime()
        : 0;
      return timeB - timeA;
    });
  }, [mainChats, lastMsgByRoom, myId]);

  const forwardDestinations = useMemo(() => {
    return [
      {
        key: 'self',
        title: 'You',
        subtitle: 'Избранное · личные заметки',
        roomId: makeRoomId(myId, myId),
        recipientId: myId,
      },
      ...activatedPeers.map((peer) => ({
        key: `peer_${peer.user_id}`,
        title: peer.display_name,
        subtitle: `@${peer.login || normalizeId(peer.user_id)}`,
        roomId: makeRoomId(myId, normalizeId(peer.user_id)),
        recipientId: normalizeId(peer.user_id),
      })),
      ...myGroups.map((grp) => ({
        key: `grp_${grp.id}`,
        title: grp.title,
        subtitle: `Группа · ${grp.members.length} участников`,
        roomId: makeGroupRoomId(grp.id),
        recipientId: grp.id,
      })),
    ];
  }, [myId, activatedPeers, myGroups]);

  const visibleNotesAuthors = allProfiles.filter((p) => {
    if (!p.is_activated) return false;
    if (!p.note_text || !p.note_text.trim()) return false;
    const hiddenFrom = (p.note_hidden_from || []).map((x) => normalizeId(x));
    return !hiddenFrom.includes(myId);
  });

  const q = searchQuery.trim().toLowerCase();
  const searchResults = q
    ? otherUsers.filter((u) => {
        const nameMatch = (u.display_name || '').toLowerCase().includes(q);
        const loginMatch = (u.login || '').toLowerCase().includes(q);
        const noteMatch = (u.note_text || '').toLowerCase().includes(q);
        return nameMatch || loginMatch || noteMatch;
      })
    : activatedPeers;

  const globalMessageMatches = useMemo(() => {
    if (!q) return [];
    const allowedRoomSet = new Set([
      makeRoomId(myId, myId),
      ...activatedPeers.map((p) => makeRoomId(myId, normalizeId(p.user_id))),
      ...myGroups.map((g) => makeGroupRoomId(g.id)),
    ]);

    return allRoomMessages
      .filter((row) => {
        if (!row?.room_id || !allowedRoomSet.has(row.room_id)) return false;
        const clearBound = clearedAfterIdByRoom[row.room_id] || 0;
        if (Number(row.id) <= clearBound) return false;
        const preview = getPreviewLabel(row.body).toLowerCase();
        return preview.includes(q);
      })
      .slice(-40)
      .reverse();
  }, [q, allRoomMessages, myId, activatedPeers, myGroups, clearedAfterIdByRoom]);

  const openChatFromSearchMessage = (msgRow) => {
    if (!msgRow?.room_id) return;
    if (msgRow.room_id === makeRoomId(myId, myId)) {
      openSelfChat();
      return;
    }
    if (msgRow.room_id.startsWith('group__')) {
      const grpId = msgRow.room_id.replace('group__', '');
      const grp = myGroups.find((g) => g.id === grpId);
      if (grp) {
        openGroupChat(grp);
        return;
      }
    }
    const peer = activatedPeers.find(
      (p) => makeRoomId(myId, normalizeId(p.user_id)) === msgRow.room_id
    );
    if (peer) {
      openPeerChat(peer);
    }
  };

  const livePeer =
    activeChat?.type === 'peer' && activeChat.peer
      ? allProfiles.find(
          (u) => normalizeId(u.user_id) === normalizeId(activeChat.peer.user_id)
        ) || activeChat.peer
      : null;

  const myActiveNote = profile.note_text && profile.note_text.trim() ? profile.note_text.trim() : '';

  const visibleMessages = useMemo(() => {
    const base = messages.filter((m) => !hiddenMsgIds.includes(m.id));
    const needle = chatSearchText.trim().toLowerCase();
    if (!needle) return base;
    return base.filter((m) => {
      const preview = getPreviewLabel(m.body).toLowerCase();
      const senderName = (m.sender || '').toLowerCase();
      return preview.includes(needle) || senderName.includes(needle);
    });
  }, [messages, hiddenMsgIds, chatSearchText]);

  const renderUnreadBadge = (count) => {
    if (!count || count <= 0) return null;
    return (
      <View style={[styles.unreadBadge, { backgroundColor: theme.accent }]}>
        <Text style={styles.unreadBadgeText}>{count > 99 ? '99+' : count}</Text>
      </View>
    );
  };

  const renderSelfContactCard = () => (
    <TouchableOpacity
      style={[
        styles.peerCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
      onPress={() => {
        setSubScreen(null);
        openSelfChat();
      }}
    >
      <AvatarCircle user={profile} theme={theme} size={50} isSelf={true} />
      <View style={styles.peerBody}>
        <Text style={[styles.peerName, { color: theme.text }]}>You</Text>
        <Text style={[styles.peerSub, { color: theme.textMuted }]} numberOfLines={1}>
          {selfLastMsg ? getPreviewLabel(selfLastMsg.body) : 'Избранное · личные заметки'}
        </Text>
      </View>
      <View style={[styles.pillAction, { backgroundColor: theme.accentSoft }]}>
        <Text style={[styles.pillActionText, { color: theme.accentText }]}>Открыть</Text>
      </View>
    </TouchableOpacity>
  );

  const renderChatListRows = (listData, isArchivedList) => {
    return (
      <>
        {!isArchivedList && hasWrittenToSelf && (
          <TouchableOpacity
            style={[
              styles.peerCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={openSelfChat}
            onLongPress={() =>
              setChatRowMenuTarget({
                roomId: selfRoomId,
                title: 'You',
                canArchive: false,
                isArchived: false,
                isSelf: true,
              })
            }
          >
            <AvatarCircle user={profile} theme={theme} size={50} isSelf={true} />
            <View style={styles.peerBody}>
              <View style={styles.peerTopRow}>
                <Text style={[styles.peerName, { color: theme.text }]}>You</Text>
                <Text style={[styles.chatRowTime, { color: theme.textMuted }]}>
                  {formatTime(selfLastMsg?.created_at)}
                </Text>
              </View>
              <Text style={[styles.peerSub, { color: theme.textMuted }]} numberOfLines={1}>
                {getPreviewLabel(selfLastMsg.body)}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {listData.length === 0 && (!hasWrittenToSelf || isArchivedList) ? (
          <View
            style={[
              styles.surfaceCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              {isArchivedList
                ? 'Архив пуст.'
                : 'Чатов пока нет. Нажми «Контакты» вверху, чтобы открыть You или начать чат с участником.'}
            </Text>
          </View>
        ) : (
          listData.map((peer) => {
            const pid = normalizeId(peer.user_id);
            const isArch = archivedIds.includes(pid);
            const roomId = makeRoomId(myId, pid);
            const lastMsg = lastMsgByRoom[roomId] || null;
            const isLastMine = lastMsg && normalizeId(lastMsg.sender_id) === myId;
            const unreadCount = unreadByRoom[roomId] || 0;

            return (
              <TouchableOpacity
                key={peer.user_id}
                activeOpacity={0.85}
                style={[
                  styles.peerCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={() => openPeerChat(peer)}
                onLongPress={() =>
                  setChatRowMenuTarget({
                    roomId,
                    peerUserId: pid,
                    title: peer.display_name,
                    canArchive: true,
                    isArchived: isArch,
                    isSelf: false,
                  })
                }
              >
                <TouchableOpacity onPress={() => setInspectedUser(peer)}>
                  <AvatarCircle user={peer} theme={theme} size={50} />
                </TouchableOpacity>

                <View style={styles.peerBody}>
                  <View style={styles.peerTopRow}>
                    <Text style={[styles.peerName, { color: theme.text }]}>
                      {peer.display_name}
                    </Text>
                    <View style={styles.chatMetaRight}>
                      {renderUnreadBadge(unreadCount)}
                      <Text style={[styles.chatRowTime, { color: theme.textMuted }]}>
                        {lastMsg ? formatTime(lastMsg.created_at) : ''}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.peerSub, { color: theme.textMuted }]} numberOfLines={1}>
                    {lastMsg
                      ? `${isLastMine ? 'Вы: ' : ''}${getPreviewLabel(lastMsg.body)}`
                      : peer.bio || `@${peer.login || peer.user_id}`}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </>
    );
  };

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.bg }]}
      edges={subScreen === 'room' ? ['top'] : ['top', 'bottom']}
    >
      {subScreen === 'contacts' && (
        <View style={styles.flex1}>
          <View
            style={[
              styles.topBar,
              { backgroundColor: theme.surface, borderBottomColor: theme.border },
            ]}
          >
            <TouchableOpacity onPress={() => setSubScreen(null)}>
              <Text style={[styles.backActionText, { color: theme.accentText }]}>← Назад</Text>
            </TouchableOpacity>
            <Text style={[styles.topBarTitle, { color: theme.text }]}>Контакты</Text>
            <TouchableOpacity onPress={() => setCreateGroupOpen(true)}>
              <Text style={[styles.accentLink, { color: theme.accentText }]}>+ Группа</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollPad}>
            {renderSelfContactCard()}

            <Text style={[styles.groupHeading, { color: theme.textMuted }]}>Участники круга</Text>
            {activatedPeers.length === 0 ? (
              <View
                style={[
                  styles.surfaceCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                  Пока никто из приглашённых не завершил регистрацию.
                </Text>
              </View>
            ) : (
              activatedPeers.map((person) => (
                <View
                  key={person.user_id}
                  style={[
                    styles.peerCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <TouchableOpacity onPress={() => setInspectedUser(person)}>
                    <AvatarCircle user={person} theme={theme} size={50} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.peerBody} onPress={() => setInspectedUser(person)}>
                    <Text style={[styles.peerName, { color: theme.text }]}>
                      {person.display_name}
                    </Text>
                    <Text style={[styles.peerSub, { color: theme.textMuted }]}>
                      @{person.login || person.user_id}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pillAction, { backgroundColor: theme.accentSoft }]}
                    onPress={() => {
                      setSubScreen(null);
                      openPeerChat(person);
                    }}
                  >
                    <Text style={[styles.pillActionText, { color: theme.accentText }]}>Чат</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}

            <Text style={[styles.groupHeading, { color: theme.textMuted }]}>Ожидают первый вход</Text>
            {pendingInvites.length === 0 ? (
              <View
                style={[
                  styles.surfaceCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                  Нет неактивированных логинов.
                </Text>
              </View>
            ) : (
              pendingInvites.map((inv) => (
                <View
                  key={inv.user_id}
                  style={[
                    styles.peerCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                  ]}
                >
                  <AvatarCircle user={inv} theme={theme} size={46} />
                  <View style={styles.peerBody}>
                    <Text style={[styles.peerName, { color: theme.text }]}>
                      @{inv.login || inv.user_id}
                    </Text>
                    <Text style={[styles.unregSub, { color: theme.textMuted }]}>
                      ещё не зарегистрирован
                    </Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {subScreen === 'archive' && (
        <View style={styles.flex1}>
          <View
            style={[
              styles.topBar,
              { backgroundColor: theme.surface, borderBottomColor: theme.border },
            ]}
          >
            <TouchableOpacity onPress={() => setSubScreen(null)}>
              <Text style={[styles.backActionText, { color: theme.accentText }]}>← Чаты</Text>
            </TouchableOpacity>
            <Text style={[styles.topBarTitle, { color: theme.text }]}>Архивные чаты</Text>
            <View style={{ width: 52 }} />
          </View>
          <ScrollView style={styles.flex1} contentContainerStyle={styles.listPad}>
            {renderChatListRows(archivedChats, true)}
          </ScrollView>
        </View>
      )}

      {subScreen === 'room' && activeChat && (
        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <View style={styles.flex1}>
            <View
              style={[
                styles.topBar,
                { backgroundColor: theme.surface, borderBottomColor: theme.border },
              ]}
            >
              <TouchableOpacity
                style={styles.backAction}
                onPress={() => {
                  setEditingMsg(null);
                  setReplyingToMsg(null);
                  setRoomMenuOpen(false);
                  setChatSearchOpen(false);
                  setChatSearchText('');
                  setSubScreen(null);
                  setActiveChat(null);
                }}
              >
                <Text style={[styles.backActionText, { color: theme.accentText }]}>←</Text>
              </TouchableOpacity>

              {activeChat.type === 'self' ? (
                <View style={styles.roomMeta}>
                  <Text style={[styles.roomName, { color: theme.text }]}>You</Text>
                  <Text style={[styles.roomStatus, { color: theme.textMuted }]}>
                    Избранное · личные заметки
                  </Text>
                </View>
              ) : activeChat.type === 'group' && currentGroup ? (
                <TouchableOpacity
                  style={styles.roomMeta}
                  onPress={() => setGroupMembersModalOpen(true)}
                >
                  <Text style={[styles.roomName, { color: theme.text }]}>
                    {currentGroup.title}
                  </Text>
                  <Text style={[styles.roomStatus, { color: theme.textMuted }]}>
                    {currentGroup.members.length} участников ·{' '}
                    {isCurrentUserGroupAdmin ? 'админ' : 'участник'}
                  </Text>
                </TouchableOpacity>
              ) : livePeer ? (
                <TouchableOpacity
                  style={styles.roomHeaderPeerRow}
                  onPress={() => setInspectedUser(livePeer)}
                >
                  <AvatarCircle user={livePeer} theme={theme} size={36} />
                  <View style={styles.roomMeta}>
                    <Text style={[styles.roomName, { color: theme.text }]}>
                      {livePeer.display_name}
                    </Text>
                    <Text style={[styles.roomStatus, { color: theme.textMuted }]}>
                      @{livePeer.login || normalizeId(livePeer.user_id)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={styles.threeDotsBtn}
                onPress={() => setRoomMenuOpen((v) => !v)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.threeDotsText, { color: theme.text }]}>⋮</Text>
              </TouchableOpacity>
            </View>

            {roomMenuOpen && (
              <View
                style={[
                  styles.compactRoomMenu,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <TouchableOpacity
                  style={styles.compactMenuItem}
                  onPress={() => {
                    setRoomMenuOpen(false);
                    setChatSearchOpen(true);
                  }}
                >
                  <Text style={[styles.compactMenuLabel, { color: theme.text }]}>Поиск по чату</Text>
                </TouchableOpacity>

                <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

                <TouchableOpacity
                  style={styles.compactMenuItem}
                  onPress={() => {
                    setRoomMenuOpen(false);
                    clearRoomForMe(activeRoomId, messages);
                  }}
                >
                  <Text style={[styles.compactMenuLabel, { color: theme.dangerText }]}>
                    Очистить чат
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {chatSearchOpen && (
              <View
                style={[
                  styles.chatSearchBar,
                  { backgroundColor: theme.surface, borderBottomColor: theme.border },
                ]}
              >
                <TextInput
                  style={[
                    styles.chatSearchInput,
                    { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text },
                  ]}
                  placeholder="Поиск в переписке..."
                  placeholderTextColor={theme.textMuted}
                  value={chatSearchText}
                  onChangeText={setChatSearchText}
                  autoFocus
                />
                <TouchableOpacity
                  onPress={() => {
                    setChatSearchText('');
                    setChatSearchOpen(false);
                  }}
                >
                  <Text style={[styles.pinnedUnpinText, { color: theme.textMuted }]}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            {activePinnedMsg && (
              <View
                style={[
                  styles.pinnedBanner,
                  {
                    backgroundColor: theme.surfaceAlt,
                    borderBottomColor: theme.border,
                    borderLeftColor: theme.accent,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.flex1}
                  onPress={() => {
                    const idx = visibleMessages.findIndex((m) => m.id === activePinnedMsg.id);
                    if (idx >= 0) {
                      listRef.current?.scrollToIndex({ index: idx, animated: true });
                    }
                  }}
                >
                  <Text style={[styles.pinnedTitle, { color: theme.accentText }]}>
                    Закреплённое ({safePinIdx + 1}/{pinnedMessagesList.length})
                  </Text>
                  <Text style={[styles.pinnedPreview, { color: theme.text }]} numberOfLines={1}>
                    {getPreviewLabel(activePinnedMsg.body)}
                  </Text>
                </TouchableOpacity>

                {pinnedMessagesList.length > 1 && (
                  <TouchableOpacity
                    style={[styles.pinCycleBtn, { backgroundColor: theme.accentSoft }]}
                    onPress={() =>
                      setActivePinIndexByRoom((prev) => ({
                        ...prev,
                        [activeRoomId]: safePinIdx + 1,
                      }))
                    }
                  >
                    <Text style={[styles.pinCycleText, { color: theme.accentText }]}>След.</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity onPress={() => togglePinMessage(activePinnedMsg.id)}>
                  <Text style={[styles.pinnedUnpinText, { color: theme.textMuted }]}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={[styles.flex1, { backgroundColor: theme.bg }]}>
              {CHAT_BG_SOURCE ? (
                <ImageBackground
                  source={CHAT_BG_SOURCE}
                  style={styles.flex1}
                  imageStyle={{ opacity: theme.isDark ? 0.34 : 0.16 }}
                  resizeMode="cover"
                >
                  <FlatList
                    ref={listRef}
                    style={styles.flex1}
                    data={visibleMessages}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={styles.messagesPad}
                    keyboardShouldPersistTaps="handled"
                    onScrollToIndexFailed={() => {
                      listRef.current?.scrollToEnd({ animated: true });
                    }}
                    renderItem={({ item, index }) => {
                      const senderNorm = normalizeId(item.sender_id);
                      const isMine = activeChat.type === 'self' || senderNorm === myId;
                      const isSenderAdmin =
                        activeChat.type === 'group' && currentGroup?.admins?.includes(senderNorm);

                      const isLastMine =
                        activeChat.type === 'peer' &&
                        isMine &&
                        index ===
                          visibleMessages
                            .map((m) => normalizeId(m.sender_id))
                            .lastIndexOf(myId);

                      const showReadReceipt =
                        isLastMine &&
                        !profile.hide_read_receipts &&
                        !livePeer?.hide_read_receipts &&
                        Boolean(item.read_at);

                      const parsed = parseRichBody(item.body);
                      const reactionsForMsg = msgReactions[item.id] || [];

                      return (
                        <View style={styles.msgSlot}>
                          <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => handleMessagePress(item)}
                            onLongPress={() => openMessageMenu(item)}
                            style={[
                              styles.msgBubble,
                              parsed.kind === 'image' && styles.photoBubbleWrap,
                              isMine
                                ? {
                                    backgroundColor:
                                      parsed.kind === 'image' ? theme.surface : theme.bubbleMine,
                                    alignSelf: 'flex-end',
                                    borderBottomRightRadius: 6,
                                    borderColor:
                                      parsed.kind === 'image' ? theme.accent : 'transparent',
                                    borderWidth: parsed.kind === 'image' ? 1.5 : 0,
                                  }
                                : {
                                    backgroundColor:
                                      parsed.kind === 'image' ? theme.surface : theme.bubblePeer,
                                    alignSelf: 'flex-start',
                                    borderBottomLeftRadius: 6,
                                    borderColor: theme.border,
                                    borderWidth: 1,
                                  },
                            ]}
                          >
                            {!isMine && activeChat.type === 'group' && (
                              <Text style={[styles.msgAuthor, { color: theme.accentText }]}>
                                {item.sender}
                                {isSenderAdmin ? ' · админ' : ''}
                              </Text>
                            )}

                            {activeChat.type === 'group' && isMine && isSenderAdmin && (
                              <Text style={[styles.mineAdminTag, { color: theme.accentText }]}>
                                админ
                              </Text>
                            )}

                            {parsed.forwardedFrom ? (
                              <Text
                                style={[
                                  styles.forwardedTag,
                                  {
                                    color:
                                      parsed.kind === 'image' || !isMine
                                        ? theme.accentText
                                        : 'rgba(255,255,255,0.88)',
                                  },
                                ]}
                              >
                                Переслано от {parsed.forwardedFrom}
                              </Text>
                            ) : null}

                            {parsed.replyTo ? (
                              <View
                                style={[
                                  styles.replyQuoteBox,
                                  {
                                    backgroundColor: isMine
                                      ? 'rgba(255,255,255,0.14)'
                                      : theme.surfaceAlt,
                                    borderLeftColor: isMine ? '#ffffff' : theme.accent,
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.replyQuoteSender,
                                    { color: isMine ? '#ffffff' : theme.accentText },
                                  ]}
                                >
                                  {parsed.replyTo.sender}
                                </Text>
                                <Text
                                  style={[
                                    styles.replyQuoteText,
                                    { color: isMine ? 'rgba(255,255,255,0.9)' : theme.textMuted },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {parsed.replyTo.preview}
                                </Text>
                              </View>
                            ) : null}

                            {parsed.kind === 'image' ? (
                              <View style={styles.framedPhotoBox}>
                                <Image
                                  source={{ uri: parsed.meta.uri }}
                                  style={styles.framedPhotoImg}
                                  resizeMode="cover"
                                />
                                {parsed.text ? (
                                  <Text style={[styles.photoCaption, { color: theme.text }]}>
                                    {parsed.text}
                                  </Text>
                                ) : null}
                              </View>
                            ) : parsed.kind === 'file' ? (
                              <View style={styles.fileCardRow}>
                                <Text
                                  style={[
                                    styles.fileExtBadge,
                                    {
                                      backgroundColor: theme.accentSoft,
                                      color: theme.accentText,
                                    },
                                  ]}
                                >
                                  {(parsed.meta.ext || 'FILE').toUpperCase()}
                                </Text>
                                <View style={styles.flex1}>
                                  <Text
                                    style={[
                                      styles.fileNameText,
                                      { color: isMine ? theme.bubbleMineText : theme.bubblePeerText },
                                    ]}
                                    numberOfLines={2}
                                  >
                                    {parsed.text}
                                  </Text>
                                </View>
                              </View>
                            ) : parsed.kind === 'voice' ? (
                              <VoiceMessageBubble
                                uri={parsed.meta?.uri}
                                durationSec={parsed.meta?.duration}
                                isMine={isMine}
                                theme={theme}
                                msgId={item.id}
                                activeVoiceId={activeVoiceId}
                                setActiveVoiceId={setActiveVoiceId}
                              />
                            ) : parsed.text.includes('||') ? (
                              <SpoilerTextRenderer
                                text={parsed.text}
                                isMine={isMine}
                                theme={theme}
                                msgId={item.id}
                              />
                            ) : (
                              <Text
                                style={[
                                  styles.msgText,
                                  { color: isMine ? theme.bubbleMineText : theme.bubblePeerText },
                                ]}
                              >
                                {parsed.text}
                              </Text>
                            )}

                            <Text
                              style={[
                                styles.msgClock,
                                {
                                  color:
                                    parsed.kind === 'image' || !isMine
                                      ? theme.textMuted
                                      : 'rgba(255,255,255,0.75)',
                                },
                              ]}
                            >
                              {formatTime(item.created_at)}
                            </Text>
                          </TouchableOpacity>

                          {reactionsForMsg.length > 0 && (
                            <View
                              style={[
                                styles.msgReactionPill,
                                {
                                  backgroundColor: theme.surface,
                                  borderColor: theme.border,
                                  alignSelf: isMine ? 'flex-end' : 'flex-start',
                                },
                              ]}
                            >
                              <Text style={[styles.msgReactionText, { color: theme.text }]}>
                                {reactionsForMsg.map((r) => r.emoji).join(' ')}
                              </Text>
                            </View>
                          )}

                          {showReadReceipt && (
                            <Text style={[styles.seenLabel, { color: theme.accentText }]}>
                              {formatSeenAgo(item.read_at)}
                            </Text>
                          )}
                        </View>
                      );
                    }}
                  />
                </ImageBackground>
              ) : (
                <FlatList
                  ref={listRef}
                  style={styles.flex1}
                  data={visibleMessages}
                  keyExtractor={(item) => String(item.id)}
                  contentContainerStyle={styles.messagesPad}
                  keyboardShouldPersistTaps="handled"
                  onScrollToIndexFailed={() => {
                    listRef.current?.scrollToEnd({ animated: true });
                  }}
                  renderItem={({ item, index }) => {
                    const senderNorm = normalizeId(item.sender_id);
                    const isMine = activeChat.type === 'self' || senderNorm === myId;
                    const isLastMine =
                      activeChat.type === 'peer' &&
                      isMine &&
                      index ===
                        visibleMessages.map((m) => normalizeId(m.sender_id)).lastIndexOf(myId);
                    const showReadReceipt =
                      isLastMine &&
                      !profile.hide_read_receipts &&
                      !livePeer?.hide_read_receipts &&
                      Boolean(item.read_at);
                    const parsed = parseRichBody(item.body);

                    return (
                      <View style={styles.msgSlot}>
                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={() => handleMessagePress(item)}
                          onLongPress={() => openMessageMenu(item)}
                          style={[
                            styles.msgBubble,
                            isMine
                              ? {
                                  backgroundColor: theme.bubbleMine,
                                  alignSelf: 'flex-end',
                                  borderBottomRightRadius: 6,
                                }
                              : {
                                  backgroundColor: theme.bubblePeer,
                                  alignSelf: 'flex-start',
                                  borderBottomLeftRadius: 6,
                                  borderColor: theme.border,
                                  borderWidth: 1,
                                },
                          ]}
                        >
                          <Text
                            style={[
                              styles.msgText,
                              { color: isMine ? theme.bubbleMineText : theme.bubblePeerText },
                            ]}
                          >
                            {parsed.text}
                          </Text>
                          <Text
                            style={[
                              styles.msgClock,
                              {
                                color: !isMine ? theme.textMuted : 'rgba(255,255,255,0.75)',
                              },
                            ]}
                          >
                            {formatTime(item.created_at)}
                          </Text>
                        </TouchableOpacity>
                        {showReadReceipt && (
                          <Text style={[styles.seenLabel, { color: theme.accentText }]}>
                            {formatSeenAgo(item.read_at)}
                          </Text>
                        )}
                      </View>
                    );
                  }}
                />
              )}
            </View>

            {replyingToMsg && !editingMsg && (
              <View
                style={[
                  styles.editBar,
                  { backgroundColor: theme.surfaceAlt, borderTopColor: theme.border },
                ]}
              >
                <View style={styles.flex1}>
                  <Text style={[styles.editBarLabel, { color: theme.accentText }]}>
                    Ответ: {replyingToMsg.sender}
                  </Text>
                  <Text style={[styles.editBarPreview, { color: theme.textMuted }]} numberOfLines={1}>
                    {getPreviewLabel(replyingToMsg.body)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setReplyingToMsg(null)}>
                  <Text style={[styles.pinnedUnpinText, { color: theme.textMuted }]}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            {editingMsg && (
              <View
                style={[
                  styles.editBar,
                  { backgroundColor: theme.surfaceAlt, borderTopColor: theme.border },
                ]}
              >
                <View style={styles.flex1}>
                  <Text style={[styles.editBarLabel, { color: theme.accentText }]}>
                    Редактирование сообщения
                  </Text>
                  <Text style={[styles.editBarPreview, { color: theme.textMuted }]} numberOfLines={1}>
                    {getPreviewLabel(editingMsg.body)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setEditingMsg(null);
                    setText('');
                  }}
                >
                  <Text style={[styles.pinnedUnpinText, { color: theme.textMuted }]}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            <View
              style={[
                styles.composerBar,
                { backgroundColor: theme.surface, borderTopColor: theme.border },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.attachBtn,
                  { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                ]}
                onPress={pickPhotoForChat}
              >
                <Text style={[styles.attachBtnText, { color: theme.accentText }]}>Фото</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.attachBtn,
                  { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                ]}
                onPress={pickFileForChat}
              >
                <Text style={[styles.attachBtnText, { color: theme.accentText }]}>Файл</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.attachBtn,
                  { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                ]}
                onPress={applySpoilerToInput}
              >
                <Text style={[styles.attachBtnText, { color: theme.accentText }]}>||</Text>
              </TouchableOpacity>

              <TextInput
                style={[
                  styles.composerInput,
                  {
                    backgroundColor: theme.surfaceAlt,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                placeholder={
                  isRecording
                    ? `Запись голоса... ${formatDuration(recordSeconds)}`
                    : activeChat.type === 'self'
                    ? 'Написать в You...'
                    : 'Сообщение...'
                }
                placeholderTextColor={isRecording ? '#f87171' : theme.textMuted}
                value={text}
                onChangeText={setText}
                onFocus={() => {
                  setTimeout(() => {
                    listRef.current?.scrollToEnd({ animated: true });
                  }, 120);
                }}
                onSelectionChange={(e) => setTextSelection(e.nativeEvent.selection)}
                editable={!isRecording}
                multiline
              />

              {text.trim().length > 0 ? (
                <TouchableOpacity
                  style={[styles.sendCircle, { backgroundColor: theme.accent }]}
                  onPress={sendMessage}
                >
                  <Text style={styles.sendArrow}>{editingMsg ? '✓' : '↑'}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.voiceRecordBtn,
                    { backgroundColor: isRecording ? '#dc2626' : theme.accent },
                  ]}
                  onPress={isRecording ? stopAndSendVoiceRecording : startVoiceRecording}
                >
                  <Text style={styles.voiceRecordBtnText}>
                    {isRecording ? 'Стоп' : 'Голос'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      {!subScreen && tab === 'chats' && (
        <View style={styles.flex1}>
          <View
            style={[
              styles.topBar,
              { backgroundColor: theme.surface, borderBottomColor: theme.border },
            ]}
          >
            <Text style={[styles.topBarTitle, { color: theme.text }]}>Чаты</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.pillAction, { backgroundColor: theme.accentSoft }]}
                onPress={() => setCreateGroupOpen(true)}
              >
                <Text style={[styles.pillActionText, { color: theme.accentText }]}>+ Группа</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.pillAction,
                  { backgroundColor: theme.surfaceAlt, borderColor: theme.border, borderWidth: 1 },
                ]}
                onPress={() => setSubScreen('contacts')}
              >
                <Text style={[styles.pillActionText, { color: theme.text }]}>Контакты</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeChip,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={onToggleTheme}
              >
                <Text style={[styles.themeChipText, { color: theme.accentText }]}>
                  {theme.isDark ? 'Светлая' : 'Тёмная'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.flex1} contentContainerStyle={styles.listPad}>
            <TouchableOpacity
              style={[
                styles.archiveBanner,
                { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
              ]}
              onPress={() => setSubScreen('archive')}
            >
              <Text style={[styles.archiveBannerTitle, { color: theme.text }]}>Архивированные чаты</Text>
              <Text style={[styles.archiveBannerCount, { color: theme.accentText }]}>
                {archivedChats.length > 0 ? `${archivedChats.length} ›` : 'Открыть ›'}
              </Text>
            </TouchableOpacity>

            {myGroups.length > 0 && (
              <>
                <Text style={[styles.groupHeading, { color: theme.textMuted }]}>Группы</Text>
                {myGroups.map((grp) => {
                  const gRoomId = makeGroupRoomId(grp.id);
                  const gLast = lastMsgByRoom[gRoomId] || null;
                  const gUnread = unreadByRoom[gRoomId] || 0;
                  return (
                    <TouchableOpacity
                      key={grp.id}
                      activeOpacity={0.85}
                      style={[
                        styles.peerCard,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                      ]}
                      onPress={() => openGroupChat(grp)}
                      onLongPress={() =>
                        setChatRowMenuTarget({
                          roomId: gRoomId,
                          title: grp.title,
                          canArchive: false,
                          isArchived: false,
                          isSelf: false,
                        })
                      }
                    >
                      <AvatarCircle user={grp} theme={theme} size={50} isGroup={true} />
                      <View style={styles.peerBody}>
                        <View style={styles.peerTopRow}>
                          <Text style={[styles.peerName, { color: theme.text }]}>{grp.title}</Text>
                          <View style={styles.chatMetaRight}>
                            {renderUnreadBadge(gUnread)}
                            <Text style={[styles.chatRowTime, { color: theme.textMuted }]}>
                              {gLast ? formatTime(gLast.created_at) : ''}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.peerSub, { color: theme.textMuted }]} numberOfLines={1}>
                          {gLast
                            ? `${gLast.sender}: ${getPreviewLabel(gLast.body)}`
                            : grp.description || `${grp.members.length} участников`}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            <Text style={[styles.groupHeading, { color: theme.textMuted }]}>Чаты</Text>
            {renderChatListRows(sortedMainChats, false)}
          </ScrollView>
        </View>
      )}

      {!subScreen && tab === 'search' && (
        <View style={styles.flex1}>
          <View
            style={[
              styles.topBar,
              { backgroundColor: theme.surface, borderBottomColor: theme.border },
            ]}
          >
            <Text style={[styles.topBarTitle, { color: theme.text }]}>Поиск</Text>
            <TouchableOpacity
              style={[styles.pillAction, { backgroundColor: theme.accentSoft }]}
              onPress={() => setSubScreen('contacts')}
            >
              <Text style={[styles.pillActionText, { color: theme.accentText }]}>Контакты</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollPad}>
            <TextInput
              style={[
                styles.field,
                { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text },
              ]}
              placeholder="Имя, @логин или текст в сообщениях..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />

            {q.length > 0 && (
              <>
                <View
                  style={[
                    styles.searchCountBar,
                    { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.searchCountText, { color: theme.accentText }]}>
                    Найдено {globalMessageMatches.length} сообщений
                  </Text>
                </View>

                {globalMessageMatches.map((m) => (
                  <TouchableOpacity
                    key={`match_${m.id}`}
                    style={[
                      styles.peerCard,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}
                    onPress={() => openChatFromSearchMessage(m)}
                  >
                    <View style={styles.peerBody}>
                      <View style={styles.peerTopRow}>
                        <Text style={[styles.peerName, { color: theme.text }]}>{m.sender}</Text>
                        <Text style={[styles.chatRowTime, { color: theme.textMuted }]}>
                          {formatTime(m.created_at)}
                        </Text>
                      </View>
                      <Text style={[styles.peerSub, { color: theme.textMuted }]} numberOfLines={2}>
                        {getPreviewLabel(m.body)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            <Text style={[styles.groupHeading, { color: theme.textMuted }]}>Люди</Text>
            {searchResults.map((u) => (
              <View
                key={u.user_id}
                style={[
                  styles.peerCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <TouchableOpacity onPress={() => setInspectedUser(u)}>
                  <AvatarCircle user={u} theme={theme} size={48} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.peerBody} onPress={() => setInspectedUser(u)}>
                  <Text style={[styles.peerName, { color: theme.text }]}>
                    {u.is_activated ? u.display_name : `@${u.login || u.user_id}`}
                  </Text>
                  <Text style={[styles.peerSub, { color: theme.textMuted }]}>
                    {u.is_activated ? `@${u.login || u.user_id}` : 'ещё не зарегистрирован'}
                  </Text>
                </TouchableOpacity>
                {u.is_activated && (
                  <TouchableOpacity
                    style={[styles.pillAction, { backgroundColor: theme.accentSoft }]}
                    onPress={() => openPeerChat(u)}
                  >
                    <Text style={[styles.pillActionText, { color: theme.accentText }]}>Чат</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {!subScreen && tab === 'notes' && (
        <View style={styles.flex1}>
          <View
            style={[
              styles.topBar,
              { backgroundColor: theme.surface, borderBottomColor: theme.border },
            ]}
          >
            <Text style={[styles.topBarTitle, { color: theme.text }]}>Заметки круга</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[
              styles.igNotesStrip,
              { backgroundColor: theme.surface, borderBottomColor: theme.border },
            ]}
            contentContainerStyle={styles.igNotesContent}
          >
            <View style={styles.igNoteColumn}>
              <View
                style={[
                  styles.igBubble,
                  { backgroundColor: theme.noteBubble, borderColor: theme.noteBubbleBorder },
                ]}
              >
                <Text style={[styles.igBubbleText, { color: theme.text }]} numberOfLines={2}>
                  {myActiveNote
                    ? `${profile.note_sticker || ''} ${myActiveNote} ${profile.note_emoji || ''}`.trim()
                    : 'Ваша заметка'}
                </Text>
              </View>
              <AvatarCircle user={profile} theme={theme} size={62} />
              <Text style={[styles.igUserLabel, { color: theme.textMuted }]} numberOfLines={1}>
                Ваша заметка
              </Text>
            </View>

            {visibleNotesAuthors
              .filter((p) => normalizeId(p.user_id) !== myId)
              .map((peer) => (
                <TouchableOpacity
                  key={peer.user_id}
                  style={styles.igNoteColumn}
                  onPress={() => setSelectedNoteUser(peer)}
                >
                  <View
                    style={[
                      styles.igBubble,
                      { backgroundColor: theme.noteBubble, borderColor: theme.noteBubbleBorder },
                    ]}
                  >
                    <Text style={[styles.igBubbleText, { color: theme.text }]} numberOfLines={2}>
                      {`${peer.note_sticker || ''} ${peer.note_text} ${peer.note_emoji || ''}`.trim()}
                    </Text>
                  </View>
                  <AvatarCircle user={peer} theme={theme} size={62} />
                  <Text style={[styles.igUserLabel, { color: theme.textMuted }]} numberOfLines={1}>
                    {peer.display_name}
                  </Text>
                </TouchableOpacity>
              ))}
          </ScrollView>

          <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollPad}>
            <View
              style={[
                styles.surfaceCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                Стикер настроения или занятия
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
              >
                {STICKER_PACK.map((st) => {
                  const selected = noteSticker === st.emoji;
                  return (
                    <TouchableOpacity
                      key={st.id}
                      style={[
                        styles.stickerChip,
                        {
                          backgroundColor: selected ? theme.accentSoft : theme.surfaceAlt,
                          borderColor: selected ? theme.accent : theme.border,
                        },
                      ]}
                      onPress={() => setNoteSticker(st.emoji)}
                    >
                      <Text style={[styles.stickerChipText, { color: theme.text }]}>
                        {st.emoji} {st.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Эмодзи</Text>
              <View style={styles.rowWrap}>
                {EMOJIS.map((em) => (
                  <TouchableOpacity
                    key={em}
                    style={[
                      styles.emojiBtn,
                      { backgroundColor: noteEmoji === em ? theme.accent : theme.surfaceAlt },
                    ]}
                    onPress={() => setNoteEmoji(em)}
                  >
                    <Text style={styles.emojiGlyph}>{em}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[
                  styles.field,
                  { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text },
                ]}
                placeholder="Что делаешь или какое настроение? (до 60 символов)"
                placeholderTextColor={theme.textMuted}
                maxLength={60}
                value={noteText}
                onChangeText={setNoteText}
              />

              <View style={styles.dualRow}>
                <TouchableOpacity
                  style={[styles.mainButton, styles.flex1, { backgroundColor: theme.accent }]}
                  onPress={() => saveMyNote(noteText)}
                >
                  <Text style={styles.mainButtonText}>Опубликовать</Text>
                </TouchableOpacity>
                {profile.note_text ? (
                  <TouchableOpacity
                    style={[styles.clearNoteBtn, { backgroundColor: theme.surfaceAlt }]}
                    onPress={() => saveMyNote('')}
                  >
                    <Text style={[styles.clearNoteText, { color: theme.text }]}>Убрать</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <Text style={[styles.groupHeading, { color: theme.textMuted }]}>Заметки участников</Text>
            {visibleNotesAuthors.length === 0 ? (
              <View
                style={[
                  styles.surfaceCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                  Пока нет активных заметок.
                </Text>
              </View>
            ) : (
              visibleNotesAuthors.map((p) => {
                const pReactions = reactions.filter(
                  (r) => normalizeId(r.target_user_id) === normalizeId(p.user_id)
                );
                const isMe = normalizeId(p.user_id) === myId;
                return (
                  <View
                    key={p.user_id}
                    style={[
                      styles.surfaceCard,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}
                  >
                    <View style={styles.igNoteCardHeader}>
                      <TouchableOpacity onPress={() => !isMe && setInspectedUser(p)}>
                        <AvatarCircle user={p} theme={theme} size={42} />
                      </TouchableOpacity>
                      <View style={styles.flex1}>
                        <Text style={[styles.peerName, { color: theme.text }]}>
                          {isMe ? `${p.display_name} (вы)` : p.display_name}
                        </Text>
                        <Text style={[styles.noteTimeText, { color: theme.textMuted }]}>
                          Написано в {formatTime(p.note_updated_at) || 'недавно'}
                        </Text>
                      </View>
                      {!isMe && (
                        <TouchableOpacity onPress={() => openPeerChat(p)}>
                          <Text style={[styles.accentLink, { color: theme.accentText }]}>Чат</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View
                      style={[
                        styles.notePill,
                        { backgroundColor: theme.noteBubble, borderColor: theme.noteBubbleBorder },
                      ]}
                    >
                      <Text style={[styles.notePillText, { color: theme.text }]}>
                        {`${p.note_sticker || ''} ${p.note_text} ${p.note_emoji || ''}`.trim()}
                      </Text>
                    </View>

                    <View style={styles.rowWrap}>
                      {EMOJIS.map((em) => (
                        <TouchableOpacity
                          key={em}
                          style={[
                            styles.reactChip,
                            { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                          ]}
                          onPress={() => sendNoteReaction(p.user_id, em)}
                        >
                          <Text style={styles.reactGlyph}>{em}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {pReactions.length > 0 && (
                      <Text style={[styles.reactionsLine, { color: theme.accentText }]}>
                        {pReactions
                          .slice(-6)
                          .map((r) => `${r.emoji} @${r.reactor_id}`)
                          .join('   ')}
                      </Text>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      )}

      {!subScreen && tab === 'profile' && (
        <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollPad}>
          <Text style={[styles.pageHeading, { color: theme.text }]}>Настройки</Text>

          <View
            style={[
              styles.surfaceCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.profileHeaderRow}>
              <TouchableOpacity onPress={pickAvatarFromGallery}>
                <AvatarCircle user={profile} theme={theme} size={66} />
              </TouchableOpacity>

              <View style={styles.flex1}>
                <Text style={[styles.profTitle, { color: theme.text }]}>
                  {profile.display_name}
                </Text>
                <Text style={[styles.profSub, { color: theme.textMuted }]}>
                  @{profile.login || profile.user_id}
                </Text>
                <View style={styles.avatarLinksRow}>
                  <TouchableOpacity onPress={pickAvatarFromGallery}>
                    <Text style={[styles.accentLink, { color: theme.accentText }]}>
                      {profile.avatar_url ? 'Сменить фото' : 'Добавить фото'}
                    </Text>
                  </TouchableOpacity>
                  {profile.avatar_url ? (
                    <TouchableOpacity onPress={removeAvatarPhoto}>
                      <Text style={[styles.deletePhotoLink, { color: theme.dangerText }]}>
                        Удалить фото
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </View>
          </View>

          <Text style={[styles.groupHeading, { color: theme.textMuted }]}>Аккаунт</Text>
          <View
            style={[
              styles.surfaceCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Имя</Text>
            <TextInput
              style={[
                styles.field,
                { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text },
              ]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Имя"
              placeholderTextColor={theme.textMuted}
            />

            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Имя пользователя (@логин)</Text>
            <TextInput
              style={[
                styles.field,
                { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text },
              ]}
              value={editLogin}
              onChangeText={setEditLogin}
              placeholder="Логин"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Телефон (необязательно)</Text>
            <TextInput
              style={[
                styles.field,
                { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text },
              ]}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="+7 700 000 00 00"
              placeholderTextColor={theme.textMuted}
              keyboardType="phone-pad"
            />

            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>О себе</Text>
            <TextInput
              style={[
                styles.field,
                styles.bioField,
                { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text },
              ]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Коротко о себе"
              placeholderTextColor={theme.textMuted}
              multiline
            />

            <TouchableOpacity
              style={[styles.mainButton, { backgroundColor: theme.accent }]}
              onPress={saveProfileAndPrivacy}
            >
              <Text style={styles.mainButtonText}>Сохранить профиль</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.groupHeading, { color: theme.textMuted }]}>Защита PIN-кодом</Text>
          <View
            style={[
              styles.surfaceCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setPinEnabledDraft((v) => !v)}
            >
              <View style={styles.flex1}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Использовать PIN</Text>
                <Text style={[styles.settingSub, { color: theme.textMuted }]}>
                  Запрашивать 4-значный PIN при входе в приложение
                </Text>
              </View>
              <Text
                style={[
                  styles.togglePill,
                  {
                    backgroundColor: pinEnabledDraft ? theme.accent : theme.surfaceAlt,
                    color: pinEnabledDraft ? '#ffffff' : theme.textMuted,
                  },
                ]}
              >
                {pinEnabledDraft ? 'ВКЛ' : 'ВЫКЛ'}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>4-значный PIN-код</Text>
            <TextInput
              style={[
                styles.field,
                { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text },
              ]}
              value={pinCodeDraft}
              onChangeText={(val) => setPinCodeDraft(cleanPinDigits(val))}
              placeholder="Например: 1234"
              placeholderTextColor={theme.textMuted}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.mainButton, { backgroundColor: theme.accent }]}
              onPress={handleSavePinSettings}
            >
              <Text style={styles.mainButtonText}>Сохранить PIN</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.groupHeading, { color: theme.textMuted }]}>Конфиденциальность и вид</Text>
          <View
            style={[
              styles.surfaceCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <TouchableOpacity style={styles.settingRow} onPress={onToggleTheme}>
              <View style={styles.flex1}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Оформление</Text>
                <Text style={[styles.settingSub, { color: theme.textMuted }]}>
                  {theme.isDark ? 'Тёмная тема' : 'Светлая тема'}
                </Text>
              </View>
              <Text style={[styles.togglePill, { backgroundColor: theme.accent, color: '#ffffff' }]}>
                {theme.isDark ? 'ТЁМНАЯ' : 'СВЕТЛАЯ'}
              </Text>
            </TouchableOpacity>

            <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => togglePrivacyFlag('hide_read_receipts')}
            >
              <View style={styles.flex1}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Статус прочтения</Text>
                <Text style={[styles.settingSub, { color: theme.textMuted }]}>
                  Скрывать отметку «Прочитано»
                </Text>
              </View>
              <Text
                style={[
                  styles.togglePill,
                  {
                    backgroundColor: profile.hide_read_receipts ? theme.accent : theme.surfaceAlt,
                    color: profile.hide_read_receipts ? '#ffffff' : theme.textMuted,
                  },
                ]}
              >
                {profile.hide_read_receipts ? 'СКРЫТО' : 'ВИДНО'}
              </Text>
            </TouchableOpacity>

            <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
              Скрыть заметки от (ID или логины через запятую)
            </Text>
            <TextInput
              style={[
                styles.field,
                { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text },
              ]}
              value={hiddenIdsText}
              onChangeText={setHiddenIdsText}
              placeholder="id_300102, id_300103"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.mainButton, { backgroundColor: theme.accent }]}
              onPress={saveProfileAndPrivacy}
            >
              <Text style={styles.mainButtonText}>Применить настройки</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.groupHeading, { color: theme.textMuted }]}>Пригласить в закрытый круг</Text>
          <View
            style={[
              styles.surfaceCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <TextInput
              style={[
                styles.field,
                { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text },
              ]}
              placeholder="Логин (например: maya_05)"
              placeholderTextColor={theme.textMuted}
              value={inviteLogin}
              onChangeText={setInviteLogin}
              autoCapitalize="none"
            />
            <TextInput
              style={[
                styles.field,
                { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text },
              ]}
              placeholder="Одноразовый пароль"
              placeholderTextColor={theme.textMuted}
              value={inviteTempPass}
              onChangeText={setInviteTempPass}
            />
            <TouchableOpacity
              style={[styles.mainButton, { backgroundColor: theme.accent }]}
              onPress={createInviteCredentials}
            >
              <Text style={styles.mainButtonText}>Создать логин и пароль</Text>
            </TouchableOpacity>
            {createdInviteInfo ? (
              <View
                style={[
                  styles.inviteResult,
                  { backgroundColor: theme.accentSoft, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.inviteResultText, { color: theme.text }]}>
                  {createdInviteInfo}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.exitButton, { backgroundColor: theme.dangerBg }]}
              onPress={onLogout}
            >
              <Text style={[styles.exitButtonText, { color: theme.dangerText }]}>Выйти из аккаунта</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {!subScreen && (
        <View
          style={[
            styles.dockNav,
            { backgroundColor: theme.surface, borderTopColor: theme.border },
          ]}
        >
          <TouchableOpacity style={styles.dockItem} onPress={() => setTab('profile')}>
            <Text
              style={[
                styles.dockLabel,
                { color: tab === 'profile' ? theme.accentText : theme.textMuted },
              ]}
            >
              Настройки
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dockItem} onPress={() => setTab('search')}>
            <Text
              style={[
                styles.dockLabel,
                { color: tab === 'search' ? theme.accentText : theme.textMuted },
              ]}
            >
              Поиск
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dockItem} onPress={() => setTab('chats')}>
            <Text
              style={[
                styles.dockLabel,
                { color: tab === 'chats' ? theme.accentText : theme.textMuted },
              ]}
            >
              Чаты
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dockItem} onPress={() => setTab('notes')}>
            <Text
              style={[
                styles.dockLabel,
                { color: tab === 'notes' ? theme.accentText : theme.textMuted },
              ]}
            >
              Заметки
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Меню долгого нажатия на чат в списке */}
      <Modal visible={Boolean(chatRowMenuTarget)} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          style={styles.centerModalBackdrop}
          onPress={() => setChatRowMenuTarget(null)}
        >
          {chatRowMenuTarget && (
            <TouchableOpacity
              activeOpacity={1}
              style={[
                styles.actionMenuCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.sheetTitle, { color: theme.text }]}>
                {chatRowMenuTarget.title}
              </Text>

              {chatRowMenuTarget.canArchive && (
                <TouchableOpacity
                  style={[styles.menuActionItem, { backgroundColor: theme.surfaceAlt }]}
                  onPress={() => {
                    const target = chatRowMenuTarget;
                    setChatRowMenuTarget(null);
                    toggleArchivePeer(target.peerUserId);
                  }}
                >
                  <Text style={[styles.menuActionLabel, { color: theme.text }]}>
                    {chatRowMenuTarget.isArchived ? 'Вернуть из архива' : 'В архив'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.menuActionItem, { backgroundColor: theme.dangerBg }]}
                onPress={() => {
                  const target = chatRowMenuTarget;
                  setChatRowMenuTarget(null);
                  if (target.isSelf) {
                    clearRoomForMe(target.roomId, messages);
                  } else {
                    deleteRoomForMe(target.roomId);
                  }
                }}
              >
                <Text style={[styles.menuActionLabel, { color: theme.dangerText }]}>
                  {chatRowMenuTarget.isSelf ? 'Очистить чат' : 'Удалить чат'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Modal>

      {/* Пересылка сообщения */}
      <Modal visible={Boolean(forwardTargetMsg)} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.setupSheet,
              { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 },
            ]}
          >
            <View style={styles.rowBetween}>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>Переслать сообщение</Text>
              <TouchableOpacity onPress={() => setForwardTargetMsg(null)}>
                <Text style={[styles.modalCloseGlyph, { color: theme.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {forwardTargetMsg && (
              <Text style={[styles.sheetSub, { color: theme.textMuted }]} numberOfLines={2}>
                «{getPreviewLabel(forwardTargetMsg.body)}»
              </Text>
            )}

            <ScrollView style={{ maxHeight: 280 }}>
              <View style={{ gap: 8 }}>
                {forwardDestinations.map((dest) => (
                  <TouchableOpacity
                    key={dest.key}
                    style={[
                      styles.memberSelectRow,
                      { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                    ]}
                    onPress={() => forwardMessageToDestination(dest)}
                  >
                    <View style={styles.flex1}>
                      <Text style={[styles.peerName, { color: theme.text }]}>{dest.title}</Text>
                      <Text style={[styles.noteTimeText, { color: theme.textMuted }]}>
                        {dest.subtitle}
                      </Text>
                    </View>
                    <Text style={[styles.pillActionText, { color: theme.accentText }]}>
                      Отправить
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Создание группы */}
      <Modal visible={createGroupOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.setupSheet,
              { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 },
            ]}
          >
            <View style={styles.rowBetween}>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>Новая группа</Text>
              <TouchableOpacity onPress={() => setCreateGroupOpen(false)}>
                <Text style={[styles.modalCloseGlyph, { color: theme.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.field,
                { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text },
              ]}
              placeholder="Название группы"
              placeholderTextColor={theme.textMuted}
              value={newGroupTitle}
              onChangeText={setNewGroupTitle}
            />

            <TextInput
              style={[
                styles.field,
                { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text },
              ]}
              placeholder="Описание (необязательно)"
              placeholderTextColor={theme.textMuted}
              value={newGroupDesc}
              onChangeText={setNewGroupDesc}
            />

            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
              Выбери участников (ты будешь администратором)
            </Text>

            <ScrollView style={{ maxHeight: 190 }}>
              <View style={{ gap: 8 }}>
                {activatedPeers.map((u) => {
                  const uid = normalizeId(u.user_id);
                  const picked = selectedGroupMembers.includes(uid);
                  return (
                    <TouchableOpacity
                      key={u.user_id}
                      style={[
                        styles.memberSelectRow,
                        {
                          backgroundColor: picked ? theme.accentSoft : theme.surfaceAlt,
                          borderColor: picked ? theme.accent : theme.border,
                        },
                      ]}
                      onPress={() =>
                        setSelectedGroupMembers((prev) =>
                          prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]
                        )
                      }
                    >
                      <Text style={[styles.peerName, { color: theme.text }]}>{u.display_name}</Text>
                      <Text style={[styles.pillActionText, { color: theme.accentText }]}>
                        {picked ? 'Выбран' : 'Добавить'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.mainButton, { backgroundColor: theme.accent }]}
              onPress={handleCreateGroup}
            >
              <Text style={styles.mainButtonText}>Создать группу</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Участники группы */}
      <Modal visible={groupMembersModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          {currentGroup && (
            <View
              style={[
                styles.setupSheet,
                { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 },
              ]}
            >
              <View style={styles.rowBetween}>
                <Text style={[styles.sheetTitle, { color: theme.text }]}>
                  {currentGroup.title}
                </Text>
                <TouchableOpacity onPress={() => setGroupMembersModalOpen(false)}>
                  <Text style={[styles.modalCloseGlyph, { color: theme.textMuted }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.sheetSub, { color: theme.textMuted }]}>
                {currentGroup.description || 'Участники и роли администраторов'}
              </Text>

              <ScrollView style={{ maxHeight: 240 }}>
                <View style={{ gap: 8 }}>
                  {currentGroup.members.map((memberId) => {
                    const profObj =
                      allProfiles.find((p) => normalizeId(p.user_id) === memberId) || {
                        user_id: memberId,
                        display_name: memberId,
                      };
                    const isAdm = currentGroup.admins.includes(memberId);
                    const isSelfRow = memberId === myId;

                    return (
                      <View
                        key={memberId}
                        style={[
                          styles.memberManageRow,
                          { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                        ]}
                      >
                        <View style={styles.flex1}>
                          <Text style={[styles.peerName, { color: theme.text }]}>
                            {profObj.display_name}
                            {isSelfRow ? ' (вы)' : ''}
                          </Text>
                          <Text style={[styles.noteTimeText, { color: theme.accentText }]}>
                            {isAdm ? 'Администратор' : 'Участник'}
                          </Text>
                        </View>

                        {isCurrentUserGroupAdmin && !isSelfRow && (
                          <View style={styles.headerActions}>
                            <TouchableOpacity
                              style={[styles.pillAction, { backgroundColor: theme.accentSoft }]}
                              onPress={() => toggleGroupAdmin(memberId)}
                            >
                              <Text style={[styles.pillActionText, { color: theme.accentText }]}>
                                {isAdm ? 'Снять админа' : 'Сделать админом'}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.pillAction, { backgroundColor: theme.dangerBg }]}
                              onPress={() => toggleGroupMember(memberId)}
                            >
                              <Text style={[styles.pillActionText, { color: theme.dangerText }]}>
                                Удалить
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </ScrollView>

              {isCurrentUserGroupAdmin && (
                <>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                    Добавить участников в группу
                  </Text>
                  <View style={styles.rowWrap}>
                    {activatedPeers
                      .filter((u) => !currentGroup.members.includes(normalizeId(u.user_id)))
                      .map((u) => (
                        <TouchableOpacity
                          key={u.user_id}
                          style={[
                            styles.stickerChip,
                            { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                          ]}
                          onPress={() => toggleGroupMember(u.user_id)}
                        >
                          <Text style={[styles.stickerChipText, { color: theme.text }]}>
                            + {u.display_name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                </>
              )}

              <TouchableOpacity
                style={[styles.menuActionItem, { backgroundColor: theme.surfaceAlt }]}
                onPress={leaveCurrentGroup}
              >
                <Text style={[styles.menuActionLabel, { color: theme.text }]}>Выйти из группы</Text>
              </TouchableOpacity>

              {isCurrentUserGroupAdmin && (
                <TouchableOpacity
                  style={[styles.menuActionItem, { backgroundColor: theme.dangerBg }]}
                  onPress={deleteCurrentGroup}
                >
                  <Text style={[styles.menuActionLabel, { color: theme.dangerText }]}>
                    Удалить группу
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </Modal>

      {/* Меню сообщения */}
      <Modal visible={Boolean(actionTargetMsg)} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          style={styles.centerModalBackdrop}
          onPress={() => setActionTargetMsg(null)}
        >
          {actionTargetMsg && (
            <TouchableOpacity
              activeOpacity={1}
              style={[
                styles.actionMenuCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.reactionBarRow}>
                {EMOJIS.map((em) => (
                  <TouchableOpacity
                    key={em}
                    style={[styles.reactPickBtn, { backgroundColor: theme.surfaceAlt }]}
                    onPress={() => {
                      toggleMessageReaction(actionTargetMsg.id, em);
                      setActionTargetMsg(null);
                    }}
                  >
                    <Text style={styles.reactPickGlyph}>{em}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[
                    styles.moreEmojiBtn,
                    { backgroundColor: theme.accentSoft, borderColor: theme.border },
                  ]}
                  onPress={() => setShowMoreEmojis((v) => !v)}
                >
                  <Text style={[styles.moreEmojiText, { color: theme.accentText }]}>Ещё</Text>
                </TouchableOpacity>
              </View>

              {showMoreEmojis && (
                <View style={styles.extraEmojiGrid}>
                  {EXTRA_EMOJIS.map((em) => (
                    <TouchableOpacity
                      key={em}
                      style={[styles.reactPickBtn, { backgroundColor: theme.surfaceAlt }]}
                      onPress={() => {
                        toggleMessageReaction(actionTargetMsg.id, em);
                        setActionTargetMsg(null);
                      }}
                    >
                      <Text style={styles.reactPickGlyph}>{em}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={[styles.menuActionItem, { backgroundColor: theme.accentSoft }]}
                onPress={() => {
                  const msgCopy = actionTargetMsg;
                  setActionTargetMsg(null);
                  setReplyingToMsg(msgCopy);
                }}
              >
                <Text style={[styles.menuActionLabel, { color: theme.accentText }]}>Ответить</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuActionItem, { backgroundColor: theme.surfaceAlt }]}
                onPress={() => {
                  const msgCopy = actionTargetMsg;
                  setActionTargetMsg(null);
                  setForwardTargetMsg(msgCopy);
                }}
              >
                <Text style={[styles.menuActionLabel, { color: theme.text }]}>Переслать</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuActionItem, { backgroundColor: theme.surfaceAlt }]}
                onPress={() => togglePinMessage(actionTargetMsg.id)}
              >
                <Text style={[styles.menuActionLabel, { color: theme.text }]}>
                  {roomPinnedIds.some((x) => String(x) === String(actionTargetMsg.id))
                    ? 'Открепить сообщение'
                    : 'Закрепить сообщение'}
                </Text>
              </TouchableOpacity>

              {parseRichBody(actionTargetMsg.body).kind === 'text' && (
                <TouchableOpacity
                  style={[styles.menuActionItem, { backgroundColor: theme.surfaceAlt }]}
                  onPress={() => startEditingMessage(actionTargetMsg)}
                >
                  <Text style={[styles.menuActionLabel, { color: theme.text }]}>Редактировать</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.menuActionItem, { backgroundColor: theme.surfaceAlt }]}
                onPress={() => deleteMessageForMe(actionTargetMsg.id)}
              >
                <Text style={[styles.menuActionLabel, { color: theme.text }]}>Удалить у меня</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuActionItem, { backgroundColor: theme.dangerBg }]}
                onPress={() => deleteMessageForEveryone(actionTargetMsg.id)}
              >
                <Text style={[styles.menuActionLabel, { color: theme.dangerText }]}>
                  Удалить у всех
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Modal>

      {/* Полноэкранный просмотр фото */}
      <PhotoViewerModal
        galleryState={galleryState}
        onClose={() => setGalleryState({ visible: false, photos: [], index: 0 })}
      />

      {/* Карточка профиля человека */}
      <Modal visible={Boolean(inspectedUser)} transparent animationType="fade">
        <View style={styles.centerModalBackdrop}>
          {inspectedUser && (() => {
            const targetNormId = normalizeId(inspectedUser.user_id);
            const isMuted = Boolean(mutedPeers[targetNormId]);
            return (
              <View
                style={[
                  styles.profileInspectCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={styles.userInfoTopBar}>
                  <TouchableOpacity onPress={() => setInspectedUser(null)}>
                    <Text style={[styles.modalCloseGlyph, { color: theme.textMuted }]}>✕</Text>
                  </TouchableOpacity>
                  <Text style={[styles.userInfoHeading, { color: theme.text }]}>
                    Информация о пользователе
                  </Text>
                  <View style={{ width: 24 }} />
                </View>

                <View style={styles.inspectCenter}>
                  <AvatarCircle user={inspectedUser} theme={theme} size={86} />
                  <Text style={[styles.inspectName, { color: theme.text }]}>
                    {inspectedUser.display_name}
                  </Text>
                  <Text style={[styles.noteTimeText, { color: theme.textMuted }]}>
                    @{inspectedUser.login || inspectedUser.user_id}
                  </Text>
                </View>

                <View
                  style={[
                    styles.infoListCard,
                    { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                  ]}
                >
                  {inspectedUser.phone ? (
                    <>
                      <TouchableOpacity
                        style={styles.infoListRow}
                        onPress={() => startCallToUser(inspectedUser)}
                      >
                        <View style={styles.flex1}>
                          <Text style={[styles.infoListValue, { color: theme.text }]}>
                            {inspectedUser.phone}
                          </Text>
                          <Text style={[styles.infoListSub, { color: theme.textMuted }]}>
                            Телефон · нажми для звонка
                          </Text>
                        </View>
                        <Text style={[styles.accentLink, { color: theme.accentText }]}>Позвонить</Text>
                      </TouchableOpacity>
                      <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />
                    </>
                  ) : null}

                  <View style={styles.infoListRow}>
                    <View style={styles.flex1}>
                      <Text style={[styles.infoListValue, { color: theme.text }]}>
                        @{inspectedUser.login || inspectedUser.user_id}
                      </Text>
                      <Text style={[styles.infoListSub, { color: theme.textMuted }]}>
                        Имя пользователя
                      </Text>
                    </View>
                  </View>

                  {inspectedUser.bio && inspectedUser.bio.trim() ? (
                    <>
                      <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />
                      <View style={styles.infoListRow}>
                        <View style={styles.flex1}>
                          <Text style={[styles.infoListValue, { color: theme.text }]}>
                            {inspectedUser.bio}
                          </Text>
                          <Text style={[styles.infoListSub, { color: theme.textMuted }]}>
                            О себе
                          </Text>
                        </View>
                      </View>
                    </>
                  ) : null}

                  <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />

                  <TouchableOpacity
                    style={styles.infoListRow}
                    onPress={() =>
                      setMutedPeers((prev) => ({
                        ...prev,
                        [targetNormId]: !prev[targetNormId],
                      }))
                    }
                  >
                    <View style={styles.flex1}>
                      <Text style={[styles.infoListValue, { color: theme.text }]}>
                        Уведомления
                      </Text>
                      <Text style={[styles.infoListSub, { color: theme.textMuted }]}>
                        {isMuted ? 'Без звука' : 'Включены'}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.togglePill,
                        {
                          backgroundColor: isMuted ? theme.surface : theme.accentSoft,
                          color: isMuted ? theme.textMuted : theme.accentText,
                        },
                      ]}
                    >
                      {isMuted ? 'ВЫКЛ' : 'ВКЛ'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {inspectedUser.is_activated && (
                  <View style={styles.dualRow}>
                    <TouchableOpacity
                      style={[styles.mainButton, styles.flex1, { backgroundColor: theme.accent }]}
                      onPress={() => {
                        const u = inspectedUser;
                        setInspectedUser(null);
                        openPeerChat(u);
                      }}
                    >
                      <Text style={styles.mainButtonText}>Сообщение</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.secondaryCallBtn,
                        { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                      ]}
                      onPress={() => {
                        const u = inspectedUser;
                        setInspectedUser(null);
                        startCallToUser(u);
                      }}
                    >
                      <Text style={[styles.secondaryCallText, { color: theme.text }]}>Позвонить</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })()}
        </View>
      </Modal>

      {/* Экран звонка */}
      <CallScreenModal
        callState={activeCallPeer ? { peer: activeCallPeer } : null}
        theme={theme}
        onHangup={() => setActiveCallPeer(null)}
      />

      {/* Модалка заметки участника */}
      <Modal visible={Boolean(selectedNoteUser)} transparent animationType="fade">
        <View style={styles.centerModalBackdrop}>
          {selectedNoteUser && (
            <View
              style={[
                styles.profileInspectCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.igNoteCardHeader}>
                <AvatarCircle user={selectedNoteUser} theme={theme} size={46} />
                <View style={styles.flex1}>
                  <Text style={[styles.peerName, { color: theme.text }]}>
                    {selectedNoteUser.display_name}
                  </Text>
                  <Text style={[styles.noteTimeText, { color: theme.textMuted }]}>
                    Написано в {formatTime(selectedNoteUser.note_updated_at) || 'недавно'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedNoteUser(null)}>
                  <Text style={[styles.modalCloseGlyph, { color: theme.textMuted }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.notePill,
                  { backgroundColor: theme.noteBubble, borderColor: theme.noteBubbleBorder },
                ]}
              >
                <Text style={[styles.notePillText, { color: theme.text }]}>
                  {`${selectedNoteUser.note_sticker || ''} ${selectedNoteUser.note_text} ${selectedNoteUser.note_emoji || ''}`.trim()}
                </Text>
              </View>

              <View style={styles.rowWrap}>
                {EMOJIS.map((em) => (
                  <TouchableOpacity
                    key={em}
                    style={[
                      styles.reactChip,
                      { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                    ]}
                    onPress={() => {
                      sendNoteReaction(selectedNoteUser.user_id, em);
                      setSelectedNoteUser(null);
                    }}
                  >
                    <Text style={styles.reactGlyph}>{em}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.igInspectReplyRow}>
                <TextInput
                  style={[
                    styles.field,
                    styles.flex1,
                    { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text },
                  ]}
                  placeholder="Ответить на заметку..."
                  placeholderTextColor={theme.textMuted}
                  value={noteQuickReply}
                  onChangeText={setNoteQuickReply}
                />
                <TouchableOpacity
                  style={[styles.sendCircle, { backgroundColor: theme.accent }]}
                  onPress={sendNoteReply}
                >
                  <Text style={styles.sendArrow}>↑</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  const [themeMode, setThemeMode] = useState('dark');
  const [booting, setBooting] = useState(true);
  const [sessionProfile, setSessionProfile] = useState(rt.sessionProfile || null);
  const [needsForceSetup, setNeedsForceSetup] = useState(false);
  const [pinConfig, setPinConfig] = useState({ enabled: false, pin: '' });
  const [pinUnlocked, setPinUnlocked] = useState(true);

  const theme = THEMES[themeMode] || THEMES.dark;

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const resolvePinConfig = async (prof) => {
    const uid = normalizeId(prof?.user_id);
    const runtimePin = uid ? rt.pinByUser.get(uid) : null;
    const localRaw = uid ? await localStore.getItem(`${LOCAL_PIN_KEY_PREFIX}${uid}`) : null;

    let localParsed = null;
    if (localRaw) {
      try {
        localParsed = JSON.parse(localRaw);
      } catch (_) {}
    }

    const dbEnabled =
      prof?.pin_enabled !== undefined && prof?.pin_enabled !== null
        ? Boolean(prof.pin_enabled)
        : null;
    const dbPin = cleanPinDigits(prof?.app_pin || '');

    const enabled =
      runtimePin?.enabled !== undefined
        ? Boolean(runtimePin.enabled)
        : dbEnabled !== null
        ? dbEnabled
        : Boolean(localParsed?.enabled);

    const pin =
      cleanPinDigits(runtimePin?.pin || '') ||
      dbPin ||
      cleanPinDigits(localParsed?.pin || '');

    return { enabled, pin };
  };

  const persistSessionProfile = async (prof) => {
    if (!prof) return;
    rt.sessionUserId = prof.user_id;
    rt.sessionProfile = prof;
    await localStore.setItem(SESSION_USER_ID_KEY, prof.user_id);
    try {
      await localStore.setItem(SESSION_PROFILE_KEY, JSON.stringify(prof));
    } catch (_) {}
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const savedId = (await localStore.getItem(SESSION_USER_ID_KEY)) || rt.sessionUserId;
        const savedProfRaw = await localStore.getItem(SESSION_PROFILE_KEY);

        let baseProf = rt.sessionProfile || null;
        if (!baseProf && savedProfRaw) {
          try {
            baseProf = JSON.parse(savedProfRaw);
          } catch (_) {}
        }

        if (savedId) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', savedId)
            .maybeSingle();

          if (data) {
            baseProf = {
              ...(baseProf || {}),
              ...data,
              phone: data.phone || baseProf?.phone || '',
            };
          }
        }

        if (baseProf && mounted) {
          await persistSessionProfile(baseProf);
          setSessionProfile(baseProf);
          const mustSetup =
            Boolean(baseProf.must_change_password) || !Boolean(baseProf.is_activated);
          setNeedsForceSetup(mustSetup);
          const cfg = await resolvePinConfig(baseProf);
          setPinConfig(cfg);
          setPinUnlocked(!(cfg.enabled && cfg.pin.length === 4));
        }
      } catch (_) {}
      if (mounted) setBooting(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && sessionProfile && !needsForceSetup) {
        const clean = cleanPinDigits(pinConfig.pin);
        if (pinConfig.enabled && clean.length === 4) {
          setPinUnlocked(false);
        }
      }
    });
    return () => sub.remove();
  }, [sessionProfile, needsForceSetup, pinConfig]);

  const handleLoggedIn = async (prof) => {
    await persistSessionProfile(prof);
    setSessionProfile(prof);
    const mustSetup =
      Boolean(prof.must_change_password) || !Boolean(prof.is_activated);
    setNeedsForceSetup(mustSetup);
    const cfg = await resolvePinConfig(prof);
    setPinConfig(cfg);
    setPinUnlocked(!(cfg.enabled && cfg.pin.length === 4));
  };

  const handleSavePinConfig = async (nextConfig) => {
    const cleanPin = cleanPinDigits(nextConfig.pin);
    const normalized = {
      enabled: Boolean(nextConfig.enabled),
      pin: cleanPin,
    };

    setPinConfig(normalized);
    setPinUnlocked(true);

    if (!sessionProfile) return;
    const uid = normalizeId(sessionProfile.user_id);
    rt.pinByUser.set(uid, normalized);
    await localStore.setItem(`${LOCAL_PIN_KEY_PREFIX}${uid}`, JSON.stringify(normalized));

    const updatedProf = {
      ...sessionProfile,
      pin_enabled: normalized.enabled,
      app_pin: normalized.pin || null,
    };
    setSessionProfile(updatedProf);
    await persistSessionProfile(updatedProf);

    await supabase
      .from('profiles')
      .update({
        pin_enabled: normalized.enabled,
        app_pin: normalized.pin || null,
      })
      .eq('user_id', sessionProfile.user_id);
  };

  const handleLogout = async () => {
    setNeedsForceSetup(false);
    setPinUnlocked(true);
    setSessionProfile(null);
    rt.sessionUserId = null;
    rt.sessionProfile = null;
    await localStore.removeItem(SESSION_USER_ID_KEY);
    await localStore.removeItem(SESSION_PROFILE_KEY);
  };

  const handleForgotPin = async () => {
    const uid = normalizeId(sessionProfile?.user_id);
    const nextOff = { enabled: false, pin: '' };
    setPinConfig(nextOff);
    setPinUnlocked(true);
    if (uid) {
      rt.pinByUser.set(uid, nextOff);
      await localStore.setItem(`${LOCAL_PIN_KEY_PREFIX}${uid}`, JSON.stringify(nextOff));
    }
    if (sessionProfile?.user_id) {
      await supabase
        .from('profiles')
        .update({ pin_enabled: false, app_pin: null })
        .eq('user_id', sessionProfile.user_id);
    }
    alert('PIN-код сброшен. Включить его снова можно в Настройках.');
  };

  if (booting) {
    return (
      <SafeAreaProvider>
        <View style={[styles.bootScreen, { backgroundColor: theme.bg }]}>
          <Text style={[styles.bootTitle, { color: theme.text }]}>Загрузка...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  const normalizedPin = cleanPinDigits(pinConfig.pin);
  const requiresPinLock =
    Boolean(sessionProfile) &&
    !needsForceSetup &&
    Boolean(pinConfig.enabled) &&
    normalizedPin.length === 4 &&
    !pinUnlocked;

  return (
    <SafeAreaProvider>
      {sessionProfile ? (
        requiresPinLock ? (
          <PinLockScreen
            theme={theme}
            profile={sessionProfile}
            expectedPin={normalizedPin}
            onUnlock={() => setPinUnlocked(true)}
            onForgotPin={handleForgotPin}
          />
        ) : (
          <>
            <MessengerApp
              initialProfile={sessionProfile}
              theme={theme}
              onToggleTheme={toggleTheme}
              onProfileUpdated={(updated) => {
                setSessionProfile(updated);
                persistSessionProfile(updated);
                if (updated.is_activated && !updated.must_change_password) {
                  setNeedsForceSetup(false);
                }
              }}
              onLogout={handleLogout}
              pinConfig={{ enabled: pinConfig.enabled, pin: normalizedPin }}
              onSavePinConfig={handleSavePinConfig}
            />
            <ForceSetupModal
              visible={needsForceSetup}
              profile={sessionProfile}
              theme={theme}
              onCompleted={async (updated) => {
                setSessionProfile(updated);
                setNeedsForceSetup(false);
                await persistSessionProfile(updated);
              }}
              onCancel={handleLogout}
            />
          </>
        )
      ) : (
        <LoginScreen
          theme={theme}
          onToggleTheme={toggleTheme}
          onLoggedIn={handleLoggedIn}
        />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  root: { flex: 1 },

  bootScreen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bootTitle: { fontSize: 16, fontWeight: '600' },

  authScreen: { flex: 1, justifyContent: 'space-between', padding: 20 },
  authTopRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  authBox: {
    borderRadius: 18,
    padding: 20,
    gap: 12,
    borderWidth: 1,
  },
  authHeading: { fontSize: 22, fontWeight: '700' },
  authCaption: { fontSize: 13, lineHeight: 19, marginBottom: 4 },

  pinScreen: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 28 },
  pinTopBlock: { alignItems: 'center', gap: 8, marginTop: 12 },
  pinTitle: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  pinSub: { fontSize: 13 },
  pinDotsRow: { flexDirection: 'row', gap: 16, marginTop: 14 },
  pinDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  pinErrorText: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  pinPadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  pinKeyCircle: {
    width: '28%',
    aspectRatio: 1.25,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinKeyDigit: { fontSize: 24, fontWeight: '700' },
  pinKeyGhost: {
    width: '28%',
    aspectRatio: 1.25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinKeyGhostText: { fontSize: 14, fontWeight: '700' },

  callRoot: { flex: 1, justifyContent: 'space-between', padding: 24 },
  callCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  callName: { fontSize: 24, fontWeight: '700', marginTop: 8 },
  callStatus: { fontSize: 15, fontWeight: '600' },
  callControlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 },
  callCircleBtn: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  callBtnLabel: { fontSize: 13, fontWeight: '700' },
  callHangupBtn: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14 },
  callHangupText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },

  themeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  themeChipText: { fontWeight: '700', fontSize: 12 },

  fieldLabel: { fontSize: 12, fontWeight: '600' },
  field: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  bioField: { minHeight: 72, textAlignVertical: 'top' },

  mainButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  mainButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  ghostButton: { paddingVertical: 8, alignItems: 'center' },
  ghostButtonText: { fontWeight: '600', fontSize: 14 },

  dualRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  clearNoteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  clearNoteText: { fontWeight: '700', fontSize: 14 },

  secondaryCallBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCallText: { fontWeight: '700', fontSize: 14 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  centerModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  setupSheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 18,
    gap: 10,
  },
  setupBadge: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  sheetTitle: { fontSize: 19, fontWeight: '700' },
  sheetSub: { fontSize: 13, lineHeight: 18, marginBottom: 4 },

  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  memberSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  memberManageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    gap: 8,
  },
  topBarTitle: { fontSize: 20, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  pillAction: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  pillActionText: { fontWeight: '700', fontSize: 12 },

  threeDotsBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  threeDotsText: { fontSize: 20, fontWeight: '700' },

  compactRoomMenu: {
    position: 'absolute',
    top: 54,
    right: 12,
    zIndex: 30,
    width: 156,
    borderRadius: 11,
    borderWidth: 1,
    paddingVertical: 2,
  },
  compactMenuItem: { paddingHorizontal: 12, paddingVertical: 8 },
  compactMenuLabel: { fontSize: 13, fontWeight: '600' },

  chatSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  chatSearchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },

  searchCountBar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchCountText: { fontSize: 12, fontWeight: '700' },

  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderLeftWidth: 3,
    gap: 8,
  },
  pinnedTitle: { fontSize: 11, fontWeight: '700' },
  pinnedPreview: { fontSize: 13, marginTop: 1 },
  pinCycleBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  pinCycleText: { fontSize: 11, fontWeight: '700' },
  pinnedUnpinText: { fontSize: 16, fontWeight: '700', paddingHorizontal: 4 },

  archiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  archiveBannerTitle: { fontSize: 14, fontWeight: '600' },
  archiveBannerCount: { fontSize: 13, fontWeight: '700' },

  backAction: { paddingRight: 8, paddingVertical: 4 },
  backActionText: { fontWeight: '700', fontSize: 18 },
  roomHeaderPeerRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  roomMeta: { flex: 1 },
  roomName: { fontSize: 16, fontWeight: '700' },
  roomStatus: { fontSize: 11, marginTop: 1 },

  igNotesStrip: {
    maxHeight: 142,
    borderBottomWidth: 1,
  },
  igNotesContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 14,
    alignItems: 'flex-end',
  },
  igNoteColumn: {
    width: 86,
    alignItems: 'center',
  },
  igBubble: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 6,
    minWidth: 74,
    maxWidth: 94,
    borderWidth: 1,
  },
  igBubbleText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
  igUserLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 5,
    maxWidth: 84,
  },

  listPad: { padding: 12, gap: 8, paddingBottom: 24 },
  scrollPad: { padding: 14, gap: 12, paddingBottom: 32 },
  pageHeading: { fontSize: 21, fontWeight: '700' },
  groupHeading: { fontSize: 12, fontWeight: '700', marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.6 },
  emptyText: { fontSize: 13, lineHeight: 19 },

  surfaceCard: {
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
  },

  peerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1,
  },
  peerBody: { flex: 1, gap: 2 },
  peerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  chatMetaRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unreadBadge: {
    minWidth: 21,
    height: 21,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  chatRowTime: { fontSize: 11 },
  peerName: { fontSize: 15, fontWeight: '700' },
  peerSub: { fontSize: 13 },
  unregSub: { fontSize: 11, marginTop: 2 },

  messagesPad: { padding: 12, gap: 8, paddingBottom: 16 },
  msgSlot: { gap: 3 },
  msgBubble: { maxWidth: '80%', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 16 },
  photoBubbleWrap: { padding: 6, borderRadius: 18 },
  framedPhotoBox: { gap: 6 },
  framedPhotoImg: { width: 220, height: 220, borderRadius: 12 },
  photoCaption: { fontSize: 14, paddingHorizontal: 4, lineHeight: 19 },

  fileCardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 165 },
  fileExtBadge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, fontSize: 11, fontWeight: '700' },
  fileNameText: { fontSize: 13, fontWeight: '600' },

  msgAuthor: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  mineAdminTag: { fontSize: 10, fontWeight: '700', marginBottom: 2 },
  forwardedTag: { fontSize: 11, fontWeight: '600', fontStyle: 'italic', marginBottom: 3 },
  replyQuoteBox: {
    borderLeftWidth: 2.5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 5,
  },
  replyQuoteSender: { fontSize: 11, fontWeight: '700' },
  replyQuoteText: { fontSize: 12 },
  msgText: { fontSize: 15, lineHeight: 20 },
  msgClock: { fontSize: 10, alignSelf: 'flex-end', marginTop: 3 },
  seenLabel: { alignSelf: 'flex-end', fontSize: 11, fontWeight: '600', marginRight: 4 },

  spoilerFlowWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  spoilerChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  spoilerChipText: { fontSize: 14, lineHeight: 19, fontWeight: '600' },
  spoilerHintOverlay: {
    position: 'absolute',
    alignSelf: 'center',
    fontSize: 11,
    fontWeight: '700',
  },

  msgReactionPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  msgReactionText: { fontSize: 13 },

  voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 190 },
  voicePlayBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  voiceBody: { flex: 1, gap: 5 },
  voiceProgressTrack: { height: 4, borderRadius: 4, overflow: 'hidden' },
  voiceProgressFill: { height: '100%', borderRadius: 4 },
  voiceMeta: { fontSize: 11, fontWeight: '600' },

  editBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  editBarLabel: { fontSize: 12, fontWeight: '700' },
  editBarPreview: { fontSize: 12 },

  composerBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
    borderTopWidth: 1,
  },
  attachBtn: {
    paddingHorizontal: 8,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachBtnText: { fontSize: 12, fontWeight: '700' },
  composerInput: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 15,
    maxHeight: 110,
    borderWidth: 1,
  },
  sendCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendArrow: { color: '#ffffff', fontSize: 17, fontWeight: '700' },
  voiceRecordBtn: {
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceRecordBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },

  actionMenuCard: {
    borderRadius: 18,
    padding: 14,
    gap: 10,
    borderWidth: 1,
  },
  reactionBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  extraEmojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reactPickBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactPickGlyph: { fontSize: 18 },
  moreEmojiBtn: {
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreEmojiText: { fontSize: 12, fontWeight: '700' },
  menuActionItem: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  menuActionLabel: { fontSize: 14, fontWeight: '700' },

  galleryModalRoot: { flex: 1, backgroundColor: '#0e0f12' },
  galleryTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  galleryBackBtn: { paddingVertical: 4, paddingRight: 6 },
  galleryBackArrow: { color: '#ffffff', fontSize: 22, fontWeight: '700' },
  galleryAuthor: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  galleryMeta: { color: '#9ca3af', fontSize: 12, marginTop: 1 },
  galleryFullImg: { width: SCREEN_WIDTH, height: '72%' },
  galleryCaption: {
    color: '#f3f4f6',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 12,
  },

  stickerChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  stickerChipText: { fontSize: 12, fontWeight: '600' },

  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  emojiGlyph: { fontSize: 18 },
  notePill: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  notePillText: { fontSize: 15, fontWeight: '700' },
  noteTimeText: { fontSize: 11, marginTop: 1 },
  igNoteCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  igInspectReplyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reactChip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  reactGlyph: { fontSize: 15 },
  reactionsLine: { fontSize: 12, fontWeight: '500' },

  profileHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  profTitle: { fontSize: 18, fontWeight: '700' },
  profSub: { fontSize: 12, marginTop: 2 },
  avatarLinksRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4 },
  accentLink: { fontWeight: '700', fontSize: 13 },
  deletePhotoLink: { fontWeight: '700', fontSize: 13 },
  rowDivider: { height: 1, marginVertical: 2 },

  inviteResult: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  inviteResultText: { fontWeight: '600', fontSize: 13, lineHeight: 20 },

  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4, gap: 10 },
  settingTitle: { fontSize: 14, fontWeight: '700' },
  settingSub: { fontSize: 12 },
  togglePill: { fontWeight: '700', fontSize: 11, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  exitButton: { marginTop: 6, paddingVertical: 11, borderRadius: 12, alignItems: 'center' },
  exitButtonText: { fontWeight: '700', fontSize: 14 },

  dockNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 10,
  },
  dockItem: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  dockLabel: { fontSize: 13, fontWeight: '700' },

  profileInspectCard: {
    borderRadius: 18,
    padding: 18,
    gap: 14,
    borderWidth: 1,
  },
  userInfoTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfoHeading: { fontSize: 16, fontWeight: '700' },
  modalCloseGlyph: { fontSize: 18, fontWeight: '700', paddingHorizontal: 4 },
  inspectCenter: { alignItems: 'center', gap: 4 },
  inspectName: { fontSize: 20, fontWeight: '700', marginTop: 4 },

  infoListCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  infoListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  infoListValue: { fontSize: 14, fontWeight: '600' },
  infoListSub: { fontSize: 11, marginTop: 2 },
});