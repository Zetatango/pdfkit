// Generated by CoffeeScript 1.12.7
(function() {
  var EmbeddedFont, PDFFont, PDFObject,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  PDFFont = require('../font');

  PDFObject = require('../object');

  EmbeddedFont = (function(superClass) {
    var toHex;

    extend(EmbeddedFont, superClass);

    function EmbeddedFont(document, font, id) {
      this.document = document;
      this.font = font;
      this.id = id;
      this.subset = this.font.createSubset();
      this.unicode = [[0]];
      this.widths = [this.font.getGlyph(0).advanceWidth];
      this.name = this.font.postscriptName;
      this.scale = 1000 / this.font.unitsPerEm;
      this.ascender = this.font.ascent * this.scale;
      this.descender = this.font.descent * this.scale;
      this.xHeight = this.font.xHeight * this.scale;
      this.capHeight = this.font.capHeight * this.scale;
      this.lineGap = this.font.lineGap * this.scale;
      this.bbox = this.font.bbox;
      this.layoutCache = Object.create(null);
    }

    EmbeddedFont.prototype.layoutRun = function(text, features) {
      var i, j, key, len, position, ref, run;
      run = this.font.layout(text, features);
      ref = run.positions;
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        position = ref[i];
        for (key in position) {
          position[key] *= this.scale;
        }
        position.advanceWidth = run.glyphs[i].advanceWidth * this.scale;
      }
      return run;
    };

    EmbeddedFont.prototype.layoutCached = function(text) {
      var cached, run;
      if (cached = this.layoutCache[text]) {
        return cached;
      }
      run = this.layoutRun(text);
      this.layoutCache[text] = run;
      return run;
    };

    EmbeddedFont.prototype.layout = function(text, features, onlyWidth) {
      var advanceWidth, glyphs, index, last, positions, ref, run;
      if (onlyWidth == null) {
        onlyWidth = false;
      }
      if (features) {
        return this.layoutRun(text, features);
      }
      glyphs = onlyWidth ? null : [];
      positions = onlyWidth ? null : [];
      advanceWidth = 0;
      last = 0;
      index = 0;
      while (index <= text.length) {
        if ((index === text.length && last < index) || ((ref = text.charAt(index)) === ' ' || ref === '\t')) {
          run = this.layoutCached(text.slice(last, ++index));
          if (!onlyWidth) {
            glyphs.push.apply(glyphs, run.glyphs);
            positions.push.apply(positions, run.positions);
          }
          advanceWidth += run.advanceWidth;
          last = index;
        } else {
          index++;
        }
      }
      return {
        glyphs: glyphs,
        positions: positions,
        advanceWidth: advanceWidth
      };
    };

    EmbeddedFont.prototype.encode = function(text, features) {
      var base, base1, gid, glyph, glyphs, i, j, len, positions, ref, res;
      ref = this.layout(text, features), glyphs = ref.glyphs, positions = ref.positions;
      res = [];
      for (i = j = 0, len = glyphs.length; j < len; i = ++j) {
        glyph = glyphs[i];
        gid = this.subset.includeGlyph(glyph.id);
        res.push(('0000' + gid.toString(16)).slice(-4));
        if ((base = this.widths)[gid] == null) {
          base[gid] = glyph.advanceWidth * this.scale;
        }
        if ((base1 = this.unicode)[gid] == null) {
          base1[gid] = glyph.codePoints;
        }
      }
      return [res, positions];
    };

    EmbeddedFont.prototype.widthOfString = function(string, size, features) {
      var scale, width;
      width = this.layout(string, features, true).advanceWidth;
      scale = size / 1000;
      return width * scale;
    };

    EmbeddedFont.prototype.embed = function() {
      var bbox, descendantFont, descriptor, familyClass, flags, fontFile, i, isCFF, name, ref, tag;
      isCFF = this.subset.cff != null;
      fontFile = this.document.ref();
      if (isCFF) {
        fontFile.data.Subtype = 'CIDFontType0C';
      }
      this.subset.encodeStream().pipe(fontFile);
      familyClass = (((ref = this.font['OS/2']) != null ? ref.sFamilyClass : void 0) || 0) >> 8;
      flags = 0;
      if (this.font.post.isFixedPitch) {
        flags |= 1 << 0;
      }
      if ((1 <= familyClass && familyClass <= 7)) {
        flags |= 1 << 1;
      }
      flags |= 1 << 2;
      if (familyClass === 10) {
        flags |= 1 << 3;
      }
      if (this.font.head.macStyle.italic) {
        flags |= 1 << 6;
      }
      tag = ((function() {
        var j, results;
        results = [];
        for (i = j = 0; j < 6; i = ++j) {
          results.push(String.fromCharCode(Math.random() * 26 + 65));
        }
        return results;
      })()).join('');
      name = tag + '+' + this.font.postscriptName;
      bbox = this.font.bbox;
      descriptor = this.document.ref({
        Type: 'FontDescriptor',
        FontName: name,
        Flags: flags,
        FontBBox: [bbox.minX * this.scale, bbox.minY * this.scale, bbox.maxX * this.scale, bbox.maxY * this.scale],
        ItalicAngle: this.font.italicAngle,
        Ascent: this.ascender,
        Descent: this.descender,
        CapHeight: (this.font.capHeight || this.font.ascent) * this.scale,
        XHeight: (this.font.xHeight || 0) * this.scale,
        StemV: 0
      });
      if (isCFF) {
        descriptor.data.FontFile3 = fontFile;
      } else {
        descriptor.data.FontFile2 = fontFile;
      }
      descriptor.end();
      descendantFont = this.document.ref({
        Type: 'Font',
        Subtype: isCFF ? 'CIDFontType0' : 'CIDFontType2',
        BaseFont: name,
        CIDSystemInfo: {
          Registry: new String('Adobe'),
          Ordering: new String('Identity'),
          Supplement: 0
        },
        FontDescriptor: descriptor,
        W: [0, this.widths]
      });
      descendantFont.end();
      this.dictionary.data = {
        Type: 'Font',
        Subtype: 'Type0',
        BaseFont: name,
        Encoding: 'Identity-H',
        DescendantFonts: [descendantFont],
        ToUnicode: this.toUnicodeCmap()
      };
      return this.dictionary.end();
    };

    toHex = function() {
      var code, codePoints, codes;
      codePoints = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      codes = (function() {
        var j, len, results;
        results = [];
        for (j = 0, len = codePoints.length; j < len; j++) {
          code = codePoints[j];
          results.push(('0000' + code.toString(16)).slice(-4));
        }
        return results;
      })();
      return codes.join('');
    };

    EmbeddedFont.prototype.toUnicodeCmap = function() {
      var cmap, codePoints, encoded, entries, j, k, len, len1, ref, value;
      cmap = this.document.ref();
      entries = [];
      ref = this.unicode;
      for (j = 0, len = ref.length; j < len; j++) {
        codePoints = ref[j];
        encoded = [];
        for (k = 0, len1 = codePoints.length; k < len1; k++) {
          value = codePoints[k];
          if (value > 0xffff) {
            value -= 0x10000;
            encoded.push(toHex(value >>> 10 & 0x3ff | 0xd800));
            value = 0xdc00 | value & 0x3ff;
          }
          encoded.push(toHex(value));
        }
        entries.push("<" + (encoded.join(' ')) + ">");
      }
      cmap.end("/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo <<\n  /Registry (Adobe)\n  /Ordering (UCS)\n  /Supplement 0\n>> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<0000><ffff>\nendcodespacerange\n1 beginbfrange\n<0000> <" + (toHex(entries.length - 1)) + "> [" + (entries.join(' ')) + "]\nendbfrange\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend");
      return cmap;
    };

    return EmbeddedFont;

  })(PDFFont);

  module.exports = EmbeddedFont;

}).call(this);
