window.beginLoadingTagging = function () {
  /** Tagging Implementation & Privacy Management Tools
   *
   */
  window.tagging = window.tagging || {};

  // Construct window.tagging.config
  window.tagging.config =
    window.tagging.config ||
    (function () {
      var config = {};
      config.startTime = Date.now();
      config.consentReadyTime = null;
      config.maxWaitTime = 8000;
      config.processedTags = [];

      return config;
    })();

  // Construct window.tagging.environment
  window.tagging.environment =
    window.tagging.environment ||
    (function () {
      var environment = {};
      /** Select TMS environment path to use
       * if query string parameter matches .queryStringOverrideKey (e.g. tmsEnvironment)
       *    - and has a value of 'production', 'staging', or 'development'
       * then uses the environment.path lookup to set the <script src= attribute using the query string parameter key
       */
      environment.default = "production";
      environment.queryStringOverrideKey = "tmsEnvironment";
      environment.paths = {
        production:
          "//assets.adobedtm.com/launch-ENb7332ebf7da04a0cb33a8fbadb6a22ff.min.js",
        staging:
          "//assets.adobedtm.com/launch-EN1da91353a63248d8b4807b9e2f144efe-staging.min.js",
        development:
          "//assets.adobedtm.com/launch-EN3aeabdff22e3446e8520566def00a83f-development.min.js",
      };
      environment.current = null;

      environment.selectedEnvironmentPath = function () {
        var paths = this.paths;
        var defaultEnvironment = this.default;

        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
          var pair = vars[i].split("=");
          if (decodeURIComponent(pair[0]) == this.queryStringOverrideKey) {
            var qsValue = decodeURIComponent(pair[1]);
            // Use environment value lookup if exists, otherwise use default environment (production)
            this.current = paths[qsValue] ? qsValue : defaultEnvironment;
            return paths[qsValue] ? paths[qsValue] : paths[defaultEnvironment];
          }
        }

        this.current = defaultEnvironment;
        return paths[defaultEnvironment];
      };

      /**
       * scriptConfig {
       *  async: true | false ; default: false,
       *  src: string; required,
       *  type: string | undefined; default: "text/javascript",
       *  onload: function | undefined,
       * }
       */
      environment.buildScript = function (scriptConfig) {
        if (
          typeof scriptConfig !== "object" &&
          typeof scriptConfig.src !== "string"
        ) {
          return false;
        }

        var sc = scriptConfig;
        var script = document.createElement("script");
        script.async = sc.async || false;
        script.type = sc.type || "text/javascript";

        // Runs function once script is loaded
        if (typeof sc.onload === "function") {
          script.onload = sc.onload;
        }

        script.src = sc.src;
        document.getElementsByTagName("head")[0].appendChild(script);
      };

      environment.loadEnvironmentScript = function () {
        var src = this.selectedEnvironmentPath();

        // Synchronous configured (via UI) Adobe Launch requires a call to _satellite.pageBottom() to start
        var afterEnvironmentLoads = function () {
          (function waitForSatellite() {
            var tagging = window.tagging;
            var config = tagging.config;
            var elapsedTime = Date.now() - config.consentReadyTime;
            if (elapsedTime <= 5000) {
              var s = window._satellite;
              if (s && typeof s.pageBottom === "function") {
                window._satellite.pageBottom();
                return;
              } else {
                window.setTimeout(waitForSatellite, 50);
              }
            }
          })();
        };

        this.buildScript({
          src: src,
          onload: afterEnvironmentLoads,
        });
      };

      return environment;
    })();

  // Construct window.tagging.privacy
  window.tagging.privacy =
    window.tagging.privacy ||
    (function () {
      var privacy = {};
      privacy.waiting = true;
      privacy.consentReady = false;
      privacy.consentStatus = {
        Required: null,
        Analytics: null,
        SocialMedia: null,
        Advertising: null,
      };

      /** Check MSCC cookie
       * Example: MSCC=cid=r43mfs021slipg1gs37scflo-c1=2-c2=1-c3=2
       */
      privacy.checkMsccCookie = function () {
        var msccCookieMatch = document.cookie.match(
          new RegExp("(^| )MSCC=([^;]+)")
        );
        var cookieValue =
          Array.isArray(msccCookieMatch) && msccCookieMatch[2]
            ? msccCookieMatch[2]
            : false;

        if (cookieValue) {
          if (cookieValue === "NR") {
            this.consentStatus["Required"] = true;
            this.consentStatus["Analytics"] = true;
            this.consentStatus["SocialMedia"] = true;
            this.consentStatus["Advertising"] = true;
            return true;
          }
          /** Check MSCC cookie
                    * Variable:
                       c0 = Required
                       c1 = Analytics
                       c2 = Social Media
                       c3 = Advertising
             
                     Value:
                     0 = No Selection
                     1 = Rejected
                     2 = Accepted
                   */
          var msccCookieCheckerArray = [];
          msccCookieCheckerArray.push({
            name: "Required",
            cName: /c0/,
            default: true,
          });
          msccCookieCheckerArray.push({
            name: "Analytics",
            cName: /c1/,
            default: false,
          });
          msccCookieCheckerArray.push({
            name: "SocialMedia",
            cName: /c2/,
            default: false,
          });
          msccCookieCheckerArray.push({
            name: "Advertising",
            cName: /c3/,
            default: false,
          });

          for (var i = 0; i < msccCookieCheckerArray.length; i++) {
            var cookieClass = msccCookieCheckerArray[i];
            var regex = new RegExp(cookieClass.cName + /=([0-2])/);
            var match = cookieValue.match(regex);
            var value = Array.isArray(match) && match[2] ? match[2] : null;
            switch (value) {
              case null:
                // "Required" (c0) does not currently appear in the MSCC cookie value string; default = true
                if (cookieClass.name === "Required") {
                  this.consentStatus[cookieClass.name] = cookieClass.default;
                } else {
                  this.consentStatus[cookieClass.name] = null;
                }
                break;
              case "0":
                this.consentStatus[cookieClass.name] = cookieClass.default;
                break;
              case "1":
                this.consentStatus[cookieClass.name] = false;
                break;
              case "2":
                this.consentStatus[cookieClass.name] = true;
                break;
            }
          }

          if (
            this.consentStatus["Analytics"] === null ||
            this.consentStatus["SocialMedia"] === null ||
            this.consentStatus["Advertising"] === null
          ) {
            return false;
          }
          return true;
        }
        return false;
      };

      /** Check consent API for consent status
       * Checks that the window.WcpConsent object and consent data are available
       * Returns current consent data
       *
       */
      privacy.checkConsentApi = function (consentType) {
        var wcp = window.WcpConsent;
        var sc = wcp.siteConsent;

        // Test components of consent API for availability
        var consentApiReady =
          wcp &&
          typeof wcp === "function" &&
          sc &&
          typeof sc.getConsent === "function";
        var consentData = consentApiReady ? sc.getConsent() : false;
        var consentDataReady =
          consentData && consentData.constructor === Object;

        if (consentDataReady) {
          this.consentStatus["Required"] = consentData["Required"];
          this.consentStatus["Analytics"] = consentData["Analytics"];
          this.consentStatus["SocialMedia"] = consentData["SocialMedia"];
          this.consentStatus["Advertising"] = consentData["Advertising"];

          return true;
        }
        return false;
      };

      /** Checks both the MSCC and Consent API for consent status
       *
       */
      privacy.updateConsentStatus = function () {
        var msccStatus = this.checkMsccCookie();
        var consentApiStatus = false;
        if (!msccStatus) {
          consentApiStatus = this.checkConsentApi();
        }
        if (msccStatus || consentApiStatus) {
          this.consentReady = true;
          return this.consentStatus;
        }
        return false;
      };

      /** Processes Array of tags once consent verified
       *
       */
      privacy.consentQueue = [];
      privacy.processQueue = function () {
        var queue = this.consentQueue;
        var queueReady = Array.isArray(queue) && queue.length !== 0;

        if (queueReady) {
          var consentStatus = this.consentStatus;

          while (queue.length !== 0) {
            var tagData = queue.shift();
            var consentTypes = tagData.consentTypes;
            var consentTypesPass = true;

            for (var j = 0; j < consentTypes.length; j++) {
              var consentType = consentTypes[j];
              var consentCheck = consentStatus[consentType];
              if (!consentCheck) {
                consentTypesPass = false;
                break;
              }
            }

            if (consentTypesPass) {
              tagData["consent"] = true;
              // In case .tagging() callback has malformed code within it
              try {
                // Passes window.tagging object to callback
                tagData.tagging(window.tagging);
              } catch (error) {
                console.log(
                  "Error in .waitForConsent callback for: " + tagData.detail
                );
                console.log(error);
              }
            }
            tagData.time.processed = Date.now();
            window.tagging.config.processedTags.push(tagData);
          }
          return true;
        }
        return false;
      };

      /** Runs tagging once consent is validated
       * tagData: {
       *    consentTypes: ["Required", "Analytics", "SocialMedia", "Advertising"],
       *    consent: boolean,
       *    detail: "",
       *    tagging: function(tagging){},
       *    times: { added: Date, processed: Date }
       * }
       */
      privacy.waitForConsent = function (tagData) {
        var validItem =
          tagData &&
          tagData.constructor === Object &&
          Array.isArray(tagData["consentTypes"]) &&
          tagData["tagging"] &&
          typeof tagData["tagging"] === "function";

        if (validItem) {
          tagData.consent = false;
          tagData.time = {};
          tagData.time.added = Date.now();
          this.consentQueue.push(tagData);
        }

        if (this.consentReady) {
          var tagging = window.tagging;
          var config = tagging.config;
          if (config && config.consentReadyTime === null) {
            window.tagging.config.consentReadyTime = Date.now();
          }

          this.processQueue();
        } else {
          (function waiting() {
            var tagging = window.tagging;
            var config = tagging.config;
            var privacy = tagging.privacy;

            // Setting polling time limit of 8000ms
            var elapsedTime = Date.now() - config.startTime;
            if (elapsedTime <= config.maxWaitTime) {
              var consentStatus = privacy.updateConsentStatus();

              if (consentStatus && privacy.waiting) {
                privacy.waiting = false;
                privacy.processQueue();
                return;
              } else {
                privacy.waiting = true;
                window.setTimeout(waiting, 50);
              }
            }
          })();
        }
      };

      return privacy;
    })();

  // Wait for consent then load the Adobe Visitor API & Microsoft ID Sync scripts
  window.tagging.privacy.waitForConsent({
    detail: "Adobe Visitor API & Microsoft ID Sync",
    consentTypes: ["Required", "Analytics"],
    tagging: function (tagging) {
      tagging.environment.buildScript({
        src: "https://eduv2.msftedu.com/webassets/visitorAPI-idsync.js",
      });
    },
  });

  // Wait for consent then load Adobe Target script
  window.tagging.privacy.waitForConsent({
    detail: "Adobe Target | at.js",
    consentTypes: ["Required", "Analytics"],
    tagging: function (tagging) {
      tagging.environment.buildScript({
        src:
          "https://eduv2.msftedu.com/webassets/at.js" +
          "?tempCacheBust=" +
          Date.now(),
      });
    },
  });

  // Temporary pixel deployment
  var tempPixelHref =
    document.location.href.indexOf(
      "www.microsoft.com/en-us/education/devices"
    ) !== -1;
  if (tempPixelHref) {
    window.tagging.privacy.waitForConsent({
      detail: "Temp - Multiple Pixels",
      consentTypes: ["Required", "Analytics", "Advertising"],
      tagging: function (tagging) {
        // Temporary pixels
        window.tagging.temporaryPixels = true;

        // Retrieve cookie by name
        function getCookie(name) {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop().split(";").shift();
        }

        // Page Load
        (function () {
          // Yahoo
          new Image().src =
            "//sp.analytics.yahoo.com/spp.pl?a=10000&.yp=413318&ea=Landingpagevisit";
        })();

        // Click
        jQuery(document).on(
          "mousedown",
          "a[href*='aka.ms/educationsales']",
          function () {
            // Yahoo
            new Image().src =
              "//sp.analytics.yahoo.com/spp.pl?a=10000&.yp=413318&ea=teamspostclickconvert";

            // GCM - LinkClick
            (function () {
              var axel = Math.random() + "";
              var a = axel * 10000000000000;
              new Image().src =
                "https://ad.doubleclick.net/ddm/activity/src=8406733;type=corpothe;cat=corpo000;u1=us;u2=en-us;u6=Laptops%20and%20Computers%20for%20Schools%20%E2%80%93%20Microsoft%20Education;u26=connect%20with%20an%20expert;u50=https%3A%2F%2Faka.ms%2Feducationsales;u52=LinkClick;dc_lat=;dc_rdid=;tag_for_child_directed_treatment=;tfua=;npa=;ord=" +
                a +
                "?";
            })();

            // Facebook - ContactSales
            (function () {
              var fbpCookie = getCookie("_fbp");
              new Image().src =
                "//www.facebook.com/tr/?id=1770559986549030&ev=ContactSales&dl=https%3A%2F%2Fwww.microsoft.com%2Fen-us%2Feducation%2Fdevices&rl=&if=false&ts=" +
                Date.now() +
                "&v=2.9.79&r=stable&ec=2&o=29&fbp=" +
                fbpCookie +
                "&it=" +
                Date.now() +
                "&coo=false&dpo=LDU&dpoco=0&dpost=0&rqm=GET";
            })();
          }
        );
      },
    });
  }

  // Wait for consent then load Launch script
  window.tagging.privacy.waitForConsent({
    detail: "Adobe Launch",
    consentTypes: ["Required", "Analytics"],
    tagging: function (tagging) {
      tagging.environment.loadEnvironmentScript();
    },
  });
};

window.taggingLoader = {
  startTime: Date.now(),
  timeoutLimit: 10000,
  scriptRunning: false,
  durationExceeded: function () {
    var duration = Date.now() - this.startTime;
    if (duration > this.timeoutLimit) {
    }
    return duration > this.timeoutLimit;
  },
  init: function () {
    if (
      (document.readyState === "complete" ||
        document.readyState === "loaded" ||
        document.readyState === "interactive") &&
      this.scriptRunning === false
    ) {
      this.scriptRunning = true;
      window.beginLoadingTagging();
    } else if (
      document.readyState === "loading" &&
      this.durationExceeded() === false &&
      this.scriptRunning === false
    ) {
      window.setTimeout(function () {
        window.taggingLoader.init();
      }, 20);
    }
  },
};

window.taggingLoader.init();