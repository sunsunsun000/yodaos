#
# Copyright (C) 2006-2016 OpenWrt.org
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=openssl
PKG_BASE:=1.0.2
PKG_BUGFIX:=j
PKG_VERSION:=$(PKG_BASE)$(PKG_BUGFIX)
PKG_RELEASE:=1
PKG_USE_MIPS16:=0

PKG_BUILD_PARALLEL:=0

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=http://www.openssl.org/source/ \
	ftp://ftp.openssl.org/source/ \
	http://www.openssl.org/source/old/$(PKG_BASE)/ \
	ftp://ftp.funet.fi/pub/crypt/mirrors/ftp.openssl.org/source \
	ftp://ftp.sunet.se/pub/security/tools/net/openssl/source/
PKG_MD5SUM:=96322138f0b69e61b7212bc53d5e912b

PKG_LICENSE:=OpenSSL
PKG_LICENSE_FILES:=LICENSE
PKG_CONFIG_DEPENDS:= \
	CONFIG_OPENSSL_ENGINE_CRYPTO \
	CONFIG_OPENSSL_ENGINE_DIGEST \
	CONFIG_OPENSSL_WITH_EC \
	CONFIG_OPENSSL_WITH_EC2M \
	CONFIG_OPENSSL_WITH_SSL3 \
	CONFIG_OPENSSL_HARDWARE_SUPPORT

include $(INCLUDE_DIR)/package.mk
include $(INCLUDE_DIR)/host.mk
include $(INCLUDE_DIR)/host-build.mk

ifneq ($(CONFIG_CCACHE),)
HOSTCC=$(HOSTCC_NOCACHE)
HOSTCXX=$(HOSTCXX_NOCACHE)
endif

define Package/openssl/Default
  TITLE:=Open source SSL toolkit
  URL:=http://www.openssl.org/
endef

define Package/libopenssl/config
source "$(SOURCE)/Config.in"
endef

define Package/openssl/Default/description
The OpenSSL Project is a collaborative effort to develop a robust,
commercial-grade, full-featured, and Open Source toolkit implementing the Secure
Sockets Layer (SSL v2/v3) and Transport Layer Security (TLS v1) protocols as well
as a full-strength general purpose cryptography library.
endef

define Package/libopenssl
$(call Package/openssl/Default)
  SECTION:=libs
  SUBMENU:=SSL
  CATEGORY:=Libraries
  DEPENDS:=+zlib +libpthread
  TITLE+= (libraries)
  ABI_VERSION:=$(PKG_VERSION)
  MENU:=1
endef

define Package/libopenssl/description
$(call Package/openssl/Default/description)
This package contains the OpenSSL shared libraries, needed by other programs.
endef

define Package/openssl-util
  $(call Package/openssl/Default)
  SECTION:=utils
  CATEGORY:=Utilities
  DEPENDS:=+libopenssl
  TITLE+= (utility)
endef

define Package/openssl-util/conffiles
/etc/ssl/openssl.cnf
endef

define Package/openssl-util/description
$(call Package/openssl/Default/description)
This package contains the OpenSSL command-line utility.
endef


OPENSSL_NO_CIPHERS:= no-idea no-md2 no-mdc2 no-rc5 no-sha0 no-camellia no-krb5
OPENSSL_OPTIONS:= shared no-err zlib-dynamic no-sse2 no-ssl2 -ldl

ifdef CONFIG_OPENSSL_ENGINE_CRYPTO
  OPENSSL_OPTIONS += -DHAVE_CRYPTODEV
  ifdef CONFIG_OPENSSL_ENGINE_DIGEST
    OPENSSL_OPTIONS += -DUSE_CRYPTODEV_DIGESTS
  endif
else
  OPENSSL_OPTIONS += no-engines
endif

ifndef CONFIG_OPENSSL_WITH_EC
  OPENSSL_OPTIONS += no-ec
endif

ifndef CONFIG_OPENSSL_WITH_EC2M
  OPENSSL_OPTIONS += no-ec2m
endif

ifndef CONFIG_OPENSSL_WITH_SSL3
  OPENSSL_OPTIONS += no-ssl3
endif

ifndef CONFIG_OPENSSL_HARDWARE_SUPPORT
  OPENSSL_OPTIONS += no-hw
endif

ifeq ($(CONFIG_x86_64),y)
  OPENSSL_TARGET:=linux-x86_64-openwrt
  OPENSSL_MAKEFLAGS += LIBDIR=lib
else
  OPENSSL_OPTIONS+=no-sse2
  ifeq ($(CONFIG_mips)$(CONFIG_mipsel),y)
    OPENSSL_TARGET:=linux-mips-openwrt
#  else ifeq ($(CONFIG_arm)$(CONFIG_armeb),y)
#    OPENSSL_TARGET:=linux-armv4-openwrt
  else
    OPENSSL_TARGET:=linux-generic-openwrt
    OPENSSL_OPTIONS+=no-perlasm
  endif
endif

STAMP_CONFIGURED := $(STAMP_CONFIGURED)_$(subst $(space),_,$(OPENSSL_OPTIONS))

define Build/Configure
	[ -f $(STAMP_CONFIGURED) ] || { \
		rm -f $(PKG_BUILD_DIR)/*.so.* $(PKG_BUILD_DIR)/*.a; \
		find $(PKG_BUILD_DIR) -name \*.o | xargs rm -f; \
	}
	(cd $(PKG_BUILD_DIR); \
		./Configure $(OPENSSL_TARGET) \
			--prefix=/usr \
			--openssldir=/etc/ssl \
			$(TARGET_CPPFLAGS) \
			$(TARGET_LDFLAGS) -ldl \
			-DOPENSSL_SMALL_FOOTPRINT \
			$(OPENSSL_NO_CIPHERS) \
			$(OPENSSL_OPTIONS) \
	)
	# XXX: OpenSSL "make depend" will look for installed headers before its own,
	# so remove installed stuff first
	-$(SUBMAKE) -j1 clean-staging
	+$(MAKE) $(PKG_JOBS) -C $(PKG_BUILD_DIR) \
		MAKEDEPPROG="$(TARGET_CROSS)gcc" \
		OPENWRT_OPTIMIZATION_FLAGS="$(TARGET_CFLAGS)" \
		$(OPENSSL_MAKEFLAGS) \
		depend
endef

TARGET_CFLAGS += $(FPIC) -I$(CURDIR)/include

define Build/Compile
	+$(MAKE) $(PKG_JOBS) -C $(PKG_BUILD_DIR) \
		CC="$(TARGET_CC)" \
		ASFLAGS="$(TARGET_ASFLAGS) -I$(PKG_BUILD_DIR)/crypto -c" \
		AR="$(TARGET_CROSS)ar r" \
		RANLIB="$(TARGET_CROSS)ranlib" \
		OPENWRT_OPTIMIZATION_FLAGS="$(TARGET_CFLAGS)" \
		$(OPENSSL_MAKEFLAGS) \
		all
	+$(MAKE) $(PKG_JOBS) -C $(PKG_BUILD_DIR) \
		CC="$(TARGET_CC)" \
		ASFLAGS="$(TARGET_ASFLAGS) -I$(PKG_BUILD_DIR)/crypto -c" \
		AR="$(TARGET_CROSS)ar r" \
		RANLIB="$(TARGET_CROSS)ranlib" \
		OPENWRT_OPTIMIZATION_FLAGS="$(TARGET_CFLAGS)" \
		$(OPENSSL_MAKEFLAGS) \
		build-shared
	# Work around openssl build bug to link libssl.so with libcrypto.so.
	-rm $(PKG_BUILD_DIR)/libssl.so.*.*.*
	+$(MAKE) $(PKG_JOBS) -C $(PKG_BUILD_DIR) \
		CC="$(TARGET_CC)" \
		OPENWRT_OPTIMIZATION_FLAGS="$(TARGET_CFLAGS)" \
		$(OPENSSL_MAKEFLAGS) \
		do_linux-shared
	$(MAKE) -C $(PKG_BUILD_DIR) \
		CC="$(TARGET_CC)" \
		INSTALL_PREFIX="$(PKG_INSTALL_DIR)" \
		$(OPENSSL_MAKEFLAGS) \
		install
endef

define Build/InstallDev
	$(INSTALL_DIR) $(1)/usr/include
	$(CP) $(PKG_INSTALL_DIR)/usr/include/openssl $(1)/usr/include/
	$(INSTALL_DIR) $(1)/usr/lib/
ifdef CONFIG_TARGET_leo_ota_LEO_OTA
#	$(CP) $(PKG_INSTALL_DIR)/usr/lib/lib{crypto,ssl}.{a,so*} $(1)/usr/lib/
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/lib{crypto,ssl}.a $(1)/usr/lib/
else
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/lib{crypto,ssl}.{a,so*} $(1)/usr/lib/
endif
	$(INSTALL_DIR) $(1)/usr/lib/pkgconfig
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/pkgconfig/{openssl,libcrypto,libssl}.pc $(1)/usr/lib/pkgconfig/
	[ -n "$(TARGET_LDFLAGS)" ] && $(SED) 's#$(TARGET_LDFLAGS)##g' $(1)/usr/lib/pkgconfig/{openssl,libcrypto,libssl}.pc || true
endef

define Package/libopenssl/install
	$(INSTALL_DIR) $(1)/usr/lib
ifndef CONFIG_TARGET_leo_ota_LEO_OTA
	$(INSTALL_DATA) $(PKG_INSTALL_DIR)/usr/lib/libcrypto.so.* $(1)/usr/lib/
	$(INSTALL_DATA) $(PKG_INSTALL_DIR)/usr/lib/libssl.so.* $(1)/usr/lib/
endif
endef

define Package/openssl-util/install
	$(INSTALL_DIR) $(1)/etc/ssl
	$(CP) $(PKG_INSTALL_DIR)/etc/ssl/openssl.cnf $(1)/etc/ssl/
	$(INSTALL_DIR) $(1)/etc/ssl/certs
	$(INSTALL_DIR) $(1)/etc/ssl/private
	chmod 0700 $(1)/etc/ssl/private
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/bin/openssl $(1)/usr/bin/
endef

HOST_CPPFLAGS += $(HOST_FPIC)

ifeq ($(HOST_ARCH),x86_64)
  OPENSSL_HOST_TARGET:=linux-x86_64
else
  OPENSSL_HOST_TARGET:=linux-generic32
endif

define Host/Configure
	[ -f $(HOST_STAMP_CONFIGURED) ] || { \
		rm -f $(HOST_BUILD_DIR)/*.so.* $(HOST_BUILD_DIR)/*.a; \
		find $(HOST_BUILD_DIR) -name \*.o | xargs rm -f; \
	}
	(cd $(HOST_BUILD_DIR); \
		./Configure "$(OPENSSL_HOST_TARGET)" \
			--prefix=/usr \
			--openssldir=/etc/ssl \
			$(HOST_CPPFLAGS) \
			$(HOST_LDFLAGS) -ldl \
			$(OPENSSL_NO_CIPHERS) \
			shared zlib-dynamic \
	)
	# XXX: OpenSSL "make depend" will look for installed headers before its own,
	# so remove installed stuff first
	-$(SUBMAKE) -j1 clean-staging
	+$(MAKE) $(PKG_JOBS) -C $(HOST_BUILD_DIR) \
		MAKEDEPPROG="$(HOSTCC)" \
		depend
endef

define Host/Compile
	+$(MAKE) $(PKG_JOBS) -C $(HOST_BUILD_DIR) \
		CC="$(HOSTCC)" \
		all
	+$(MAKE) $(PKG_JOBS) -C $(HOST_BUILD_DIR) \
		CC="$(HOSTCC)" \
		build-shared
	# Work around openssl build bug to link libssl.so with libcrypto.so.
	-rm $(HOST_BUILD_DIR)/libssl.so.*.*.*
	+$(MAKE) $(PKG_JOBS) -C $(HOST_BUILD_DIR) \
		CC="$(HOSTCC)" \
		do_linux-shared
endef

define Host/Install
	$(MAKE) -C $(HOST_BUILD_DIR) \
		CC="$(HOSTCC)" \
		INSTALL_PREFIX="$(STAGING_DIR_HOST)" \
		install
endef

$(eval $(call BuildPackage,libopenssl))
$(eval $(call BuildPackage,openssl-util))
$(eval $(call HostBuild))

