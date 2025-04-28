// ==UserScript==
// @name         Bypass Paywalls Clarín, La Nación, Perfil (Ultra Optimizado)
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Elimina paywalls de Clarín, La Nación y Perfil con técnicas avanzadas
// @author       Chicharr0n
// @match        *://*.clarin.com/*
// @match        *://*.lanacion.com.ar/*
// @match        *://*.perfil.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @run-at       document-start
// @noframes
// @connect      *
// ==/UserScript==

(function() {
    'use strict';

    // Configuración avanzada
    const CONFIG = {
        DEBUG: true,
        COOKIE_CLEAN_INTERVAL: 30000, // 30 segundos
        MUTATION_OBSERVER_DEBOUNCE: 100,
        MAX_RETRIES: 5,
        RETRY_DELAY: 500
    };

    // Selectores mejorados y actualizados
    const PAYWALL_SELECTORS = {
        'clarin.com': [
            '#cboxOverlay', '.modalLoginPase', '.lw-app-pase', '.paywall',
            '.article-body--truncated', '.baldomero', '.modal-paywall',
            '.article-paywall', '.paywall-container', '.paywall-overlay',
            '.bloqueo-nota', '.bloqueo', '.paywall-block', '.login-wall',
            '.premium-content', '.subscription-wall', '.article-locked',
            '.nota-bloqueada', '.paywall-modal', '.paywall-backdrop',
            '.tp-modal', '.tp-backdrop', '.tp-active', '.overlay-blur'
        ],
        'lanacion.com.ar': [
            '.paywall', '.ln-login-wall', '.modal--active', '.premium-content',
            '.paywall-container', '.paywall-overlay', '.article-paywall',
            '.modal-paywall', '.bloqueo-nota', '.bloqueo', '.paywall-block',
            '.ln-premium', '.subscription-wall', '.content-locked',
            '.article-locked', '.paywall-modal', '.paywall-backdrop',
            '.tp-modal', '.tp-backdrop', '.tp-active', '.overlay-blur'
        ],
        'perfil.com': [
            '.paywall', '.subscription-overlay', '.premium-content',
            '.paywall-container', '.paywall-overlay', '.article-paywall',
            '.modal-paywall', '.bloqueo-nota', '.bloqueo', '.nota-premium',
            '.subscription-wall', '.premium-note', '.paywall-block',
            '.login-required', '.content-locked', '.article-locked',
            '.paywall-modal', '.paywall-backdrop', '.tp-modal',
            '.tp-backdrop', '.tp-active', '.overlay-blur'
        ]
    };

    // Selectores de contenido con técnicas de desbloqueo mejoradas
    const CONTENT_SELECTORS = [
        '.article-body', '.content', '.nota', '.article-content',
        '.article-text', '.note-body', '.note-content', '.story-content',
        '.entry-content', '.post-content', '.main-content', '.text-content'
    ];

    // Patrones mejorados para detección de paywalls
    const PAYWALL_PATTERNS = {
        URLS: [
            /paywall/i, /pase/i, /login/i, /subscription/i,
            /bloqueo/i, /premium/i, /membership/i, /auth/i,
            /restrict/i, /gate/i, /meter/i, /block/i, /lock/i,
            /modal/i, /overlay/i, /wall/i, /access/i
        ],
        CLASSES: [
            /paywall/i, /premium/i, /bloqueo/i, /locked/i,
            /restrict/i, /gate/i, /meter/i, /modal/i,
            /overlay/i, /wall/i, /access/i, /subscribe/i,
            /member/i, /login/i, /pase/i, /truncated/i
        ]
    };

    // Técnicas avanzadas de limpieza de estado
    function cleanState() {
        try {
            // Limpieza mejorada de cookies
            clearCookies();
            
            // Limpieza de localStorage y sessionStorage
            Object.keys(localStorage).forEach(key => {
                if (PAYWALL_PATTERNS.URLS.some(pattern => pattern.test(key))) {
                    localStorage.removeItem(key);
                    if (CONFIG.DEBUG) console.log('[Bypass Paywall] localStorage eliminado:', key);
                }
            });
            
            Object.keys(sessionStorage).forEach(key => {
                if (PAYWALL_PATTERNS.URLS.some(pattern => pattern.test(key))) {
                    sessionStorage.removeItem(key);
                    if (CONFIG.DEBUG) console.log('[Bypass Paywall] sessionStorage eliminado:', key);
                }
            });
            
            // Limpieza de IndexedDB (asíncrona)
            if (window.indexedDB) {
                const dbs = ['PaywallDB', 'SubscriptionDB', 'AuthDB', 'ClarinDB', 'LNacionDB', 'PerfilDB'];
                dbs.forEach(dbName => {
                    try {
                        const req = indexedDB.deleteDatabase(dbName);
                        req.onsuccess = () => {
                            if (CONFIG.DEBUG) console.log('[Bypass Paywall] IndexedDB eliminada:', dbName);
                        };
                    } catch (e) {
                        console.warn('[Bypass Paywall] Error eliminando IndexedDB:', e);
                    }
                });
            }
        } catch (e) {
            console.warn('[Bypass Paywall] Error en cleanState:', e);
        }
    }

    // Función mejorada para eliminar cookies
    function clearCookies() {
        try {
            const hostParts = window.location.hostname.split('.');
            const domains = [
                window.location.hostname,
                `.${hostParts.slice(-2).join('.')}`,
                `.${hostParts.slice(-3).join('.')}`
            ];

            domains.forEach(domain => {
                document.cookie.split(";").forEach(c => {
                    const cookie = c.replace(/^ +/, "").split("=")[0];
                    document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${domain}; path=/`;
                    document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${domain.replace(/^\./, '')}; path=/`;
                });
            });
            if (CONFIG.DEBUG) console.log('[Bypass Paywall] Cookies eliminadas para:', domains);
        } catch (e) {
            console.warn('[Bypass Paywall] Error al eliminar cookies:', e);
        }
    }

    // Función avanzada para eliminar elementos del paywall
    function removePaywallElements(retryCount = 0) {
        try {
            const hostname = window.location.hostname;
            let selectors = [];
            let foundElements = false;

            // Determinar selectores según el sitio
            if (hostname.includes('clarin.com')) {
                selectors = PAYWALL_SELECTORS['clarin.com'];
            } else if (hostname.includes('lanacion.com.ar')) {
                selectors = PAYWALL_SELECTORS['lanacion.com.ar'];
            } else if (hostname.includes('perfil.com')) {
                selectors = PAYWALL_SELECTORS['perfil.com'];
            }

            // Añadir detección heurística de clases
            document.querySelectorAll('*').forEach(el => {
                PAYWALL_PATTERNS.CLASSES.forEach(pattern => {
                    if (pattern.test(el.className)) {
                        el.remove();
                        foundElements = true;
                        if (CONFIG.DEBUG) console.log('[Bypass Paywall] Elemento eliminado (heurística):', el);
                    }
                });
            });

            // Procesar elementos en DOM principal y Shadow DOM
            const processElements = (root) => {
                selectors.forEach(selector => {
                    root.querySelectorAll(selector).forEach(el => {
                        el.remove();
                        foundElements = true;
                        if (CONFIG.DEBUG) console.log(`[Bypass Paywall] Eliminado: ${selector}`);
                    });
                });
            };

            // Procesar DOM principal
            processElements(document);

            // Procesar Shadow DOM recursivamente
            const processShadowRoots = (root) => {
                root.querySelectorAll('*').forEach(el => {
                    if (el.shadowRoot) {
                        processElements(el.shadowRoot);
                        processShadowRoots(el.shadowRoot);
                    }
                });
            };
            processShadowRoots(document);

            // Técnicas avanzadas de desbloqueo de contenido
            CONTENT_SELECTORS.forEach(selector => {
                document.querySelectorAll(selector).forEach(el => {
                    // Restaurar estilos
                    el.style.display = 'block';
                    el.style.opacity = '1';
                    el.style.overflow = 'visible';
                    el.style.height = 'auto';
                    el.style.maxHeight = 'none';
                    el.style.filter = 'none';
                    el.style.pointerEvents = 'auto';
                    
                    // Eliminar clases relacionadas con paywall
                    Array.from(el.classList).forEach(className => {
                        if (PAYWALL_PATTERNS.CLASSES.some(pattern => pattern.test(className))) {
                            el.classList.remove(className);
                            foundElements = true;
                        }
                    });
                    
                    // Eliminar atributos de bloqueo
                    ['data-paywall', 'data-locked', 'data-premium'].forEach(attr => {
                        if (el.hasAttribute(attr)) {
                            el.removeAttribute(attr);
                            foundElements = true;
                        }
                    });
                    
                    // Eliminar eventos de bloqueo
                    ['click', 'contextmenu', 'keydown'].forEach(event => {
                        el[`on${event}`] = null;
                    });
                });
            });

            // Eliminar estilos en línea que puedan ocultar contenido
            document.querySelectorAll('*[style*="blur"], *[style*="opacity"]').forEach(el => {
                if (el.style.filter?.includes('blur') || el.style.opacity < 1) {
                    el.style.filter = 'none';
                    el.style.opacity = '1';
                    foundElements = true;
                }
            });

            // Lógica de reintento si se encontraron elementos
            if (foundElements && retryCount < CONFIG.MAX_RETRIES) {
                setTimeout(() => {
                    removePaywallElements(retryCount + 1);
                }, CONFIG.RETRY_DELAY * (retryCount + 1));
            }

            // Depuración avanzada
            if (CONFIG.DEBUG) {
                selectors.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    if (elements.length > 0) {
                        console.warn(`[Bypass Paywall] Selector ${selector}: ${elements.length} elementos aún presentes`);
                    }
                });
            }
        } catch (e) {
            console.warn('[Bypass Paywall] Error al eliminar elementos:', e);
        }
    }

    // Interceptación avanzada de recursos
    function interceptResources() {
        try {
            // Interceptar fetch
            if (typeof window.fetch === 'function') {
                const originalFetch = window.fetch;
                window.fetch = function() {
                    const url = arguments[0]?.url || arguments[0];
                    if (url && PAYWALL_PATTERNS.URLS.some(pattern => pattern.test(url))) {
                        if (CONFIG.DEBUG) console.log('[Bypass Paywall] Solicitud fetch bloqueada:', url);
                        return Promise.reject(new Error('Solicitud de paywall bloqueada'));
                    }
                    return originalFetch.apply(this, arguments);
                };
            }

            // Interceptar XMLHttpRequest
            const originalOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function() {
                this._url = arguments[1];
                return originalOpen.apply(this, arguments);
            };

            const originalSend = XMLHttpRequest.prototype.send;
            XMLHttpRequest.prototype.send = function() {
                if (this._url && PAYWALL_PATTERNS.URLS.some(pattern => pattern.test(this._url))) {
                    if (CONFIG.DEBUG) console.log('[Bypass Paywall] Solicitud XHR bloqueada:', this._url);
                    return;
                }
                return originalSend.apply(this, arguments);
            };

            // Interceptar WebSocket
            const originalWebSocket = window.WebSocket;
            window.WebSocket = function(url) {
                if (url && PAYWALL_PATTERNS.URLS.some(pattern => pattern.test(url))) {
                    if (CONFIG.DEBUG) console.log('[Bypass Paywall] WebSocket bloqueado:', url);
                    return {
                        send: () => {},
                        close: () => {},
                        addEventListener: () => {}
                    };
                }
                return new originalWebSocket(url);
            };
        } catch (e) {
            console.warn('[Bypass Paywall] Error en interceptResources:', e);
        }
    }

    // Bloqueo avanzado de scripts
    function blockPaywallScripts() {
        try {
            // Interceptar creación de elementos
            const originalCreateElement = document.createElement;
            document.createElement = function(tagName) {
                const element = originalCreateElement.call(this, tagName);
                if (tagName.toLowerCase() === 'script') {
                    const originalSrcSetter = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src').set;
                    
                    Object.defineProperty(element, 'src', {
                        set: function(value) {
                            if (value && PAYWALL_PATTERNS.URLS.some(pattern => pattern.test(value))) {
                                if (CONFIG.DEBUG) console.log('[Bypass Paywall] Script bloqueado:', value);
                                return;
                            }
                            return originalSrcSetter.call(this, value);
                        },
                        configurable: true
                    });
                    
                    // Interceptar contenido inline
                    const originalTextSetter = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'text').set;
                    Object.defineProperty(element, 'text', {
                        set: function(value) {
                            if (value && PAYWALL_PATTERNS.URLS.some(pattern => pattern.test(value))) {
                                if (CONFIG.DEBUG) console.log('[Bypass Paywall] Script inline bloqueado');
                                return;
                            }
                            return originalTextSetter.call(this, value);
                        },
                        configurable: true
                    });
                }
                return element;
            };

            // Eliminar scripts existentes
            document.querySelectorAll('script').forEach(script => {
                const src = script.src || '';
                const content = script.textContent || '';
                
                if (PAYWALL_PATTERNS.URLS.some(pattern => 
                    pattern.test(src) || pattern.test(content))
                ) {
                    script.remove();
                    if (CONFIG.DEBUG) console.log('[Bypass Paywall] Script existente eliminado:', src || 'inline');
                }
            });
        } catch (e) {
            console.warn('[Bypass Paywall] Error en blockPaywallScripts:', e);
        }
    }

    // Sistema de sugerencias inteligentes
    function suggestAlternatives() {
        try {
            const hostname = window.location.hostname;
            const selectors = PAYWALL_SELECTORS[Object.keys(PAYWALL_SELECTORS).find(key => hostname.includes(key))] || [];
            
            setTimeout(() => {
                const paywallDetected = document.querySelector(selectors.join(','));
                const contentHidden = CONTENT_SELECTORS.some(selector => {
                    const el = document.querySelector(selector);
                    return el && (el.style.display === 'none' || el.style.opacity === '0' || el.style.visibility === 'hidden');
                });
                
                if (paywallDetected || contentHidden) {
                    const message = [
                        '[Bypass Paywall] Paywall detectado. Prueba estas alternativas:',
                        '1) Abre en modo incógnito/privado',
                        '2) Usa servicios como:',
                        '   - outline.com',
                        '   - archive.ph',
                        '   - 12ft.io',
                        '3) Borra cookies y almacenamiento local manualmente',
                        '4) Usa extensiones como uBlock Origin con filtros anti-paywall',
                        '5) Actualiza los selectores en el script:',
                        `   Selectores actuales: ${selectors.slice(0, 5).join(', ')}...`,
                        '6) Reporta problemas para mejorar el script'
                    ].join('\n');
                    
                    console.warn(message);
                    
                    // Mostrar notificación en página si el paywall persiste
                    if (paywallDetected) {
                        const notification = document.createElement('div');
                        notification.style.position = 'fixed';
                        notification.style.bottom = '20px';
                        notification.style.right = '20px';
                        notification.style.backgroundColor = '#ff4444';
                        notification.style.color = 'white';
                        notification.style.padding = '10px';
                        notification.style.borderRadius = '5px';
                        notification.style.zIndex = '999999';
                        notification.style.maxWidth = '300px';
                        notification.textContent = 'Paywall detectado. Abre la consola (F12) para ver soluciones.';
                        document.body.appendChild(notification);
                        
                        setTimeout(() => {
                            notification.remove();
                        }, 10000);
                    }
                }
            }, 5000);
        } catch (e) {
            console.warn('[Bypass Paywall] Error en suggestAlternatives:', e);
        }
    }

    // Función principal mejorada
    function initBypass() {
        try {
            // Limpieza inicial
            cleanState();
            
            // Interceptaciones
            interceptResources();
            blockPaywallScripts();
            
            // Eliminación inicial de elementos
            removePaywallElements();
            
            // Configuración de referer
            Object.defineProperty(document, 'referrer', {
                get: function() {
                    return 'https://www.google.com/';
                },
                configurable: true
            });
            
            // Observador de mutaciones con debounce mejorado
            let mutationDebounce;
            const observer = new MutationObserver((mutations) => {
                clearTimeout(mutationDebounce);
                mutationDebounce = setTimeout(() => {
                    removePaywallElements();
                }, CONFIG.MUTATION_OBSERVER_DEBOUNCE);
            });
            
            observer.observe(document, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class', 'id']
            });
            
            // Limpieza periódica de cookies
            setInterval(cleanState, CONFIG.COOKIE_CLEAN_INTERVAL);
            
            // Sugerencias
            suggestAlternatives();
        } catch (e) {
            console.warn('[Bypass Paywall] Error en initBypass:', e);
        }
    }

    // Sistema de ejecución mejorado
    function runBypass() {
        // Ejecutar inmediatamente si es posible
        if (document.documentElement) {
            initBypass();
        } else {
            document.addEventListener('DOMContentLoaded', initBypass);
        }
        
        // Ejecutar en eventos clave
        const events = ['load', 'popstate', 'hashchange'];
        events.forEach(event => {
            window.addEventListener(event, initBypass);
        });
    }

    // Iniciar el bypass
    runBypass();
})();
