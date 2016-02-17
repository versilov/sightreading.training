let {PropTypes: types} = React;

class Staff extends React.Component {
  static propTypes = {
    // rendering props
    upperLine: types.number.isRequired,
    lowerLine: types.number.isRequired,
    cleffImage: types.string.isRequired,
    staffClass: types.string.isRequired,
    keySignature: types.object,

    // state props
    notes: types.array,
    heldNotes: types.object,
    inGrand: types.bool,
  }

  constructor(props) {
    super(props);
  }

  // skips react for performance
  setOffset(amount) {
    this.refs.notes.style.transform = `translate3d(${amount}px, 0, 0)`;
  }

  componentDidUpdate() {
    this.setOffset(this.props.slider.value);
  }

  render() {
    return <div className={classNames("staff", this.props.staffClass)}>
      <img className="cleff" src={this.props.cleffImage} />

      <div className="lines">
        <div className="line1 line"></div>
        <div className="line2 line"></div>
        <div className="line3 line"></div>
        <div className="line4 line"></div>
        <div className="line5 line"></div>
      </div>

      {this.renderKeySignature()}

      <div ref="notes" className="notes">
        {this.renderNotes()}
        {this.renderHeld()}
      </div>

    </div>;
  }

  renderHeld(notes) {
    // notes that are held down but aren't correct
    return Object.keys(this.props.heldNotes).map((note, idx) =>
      !this.props.notes.inHead(note) && this.renderNote(note, {
        key: `held-${idx}`,
        classes: { held: true }
      })
    );
  }

  renderKeySignature() {
    if (!this.props.keySignature) {
      return;
    }

    let sigNotes = this.props.keySignature.notesInRange(this.props.lowerLine, this.props.upperLine)
    let topOffset = letterOffset(this.props.upperLine)

    let sigClass = signature < 0 ? "flat" : "sharp";
    let src = signature < 0 ? "svg/flat.svg" : "svg/sharp.svg";

    return <div className="key_signature">
      {sigNotes.map(function(n, i) {
        let pitch = parseNote(n);
        let fromTop = topOffset - letterOffset(pitch);
        let style = {
          top: `${Math.floor(fromTop * 25/2)}%`,
          left: `${i * 20}px`
        }

        return <img
          key={`sig-${n}`}
          data-note={n}
          style={style}
          className={classNames("accidental", sigClass)}
          src={src} />;
      }.bind(this))}
    </div>;
  }

  renderNotes() {
    let keySignatureWidth = 0
    if (this.props.keySignature) {
      let count = Math.abs(this.props.keySignature.count)
      keySignatureWidth = count > 0 ? count * 20 + 20 : 0;
    }

    return this.props.notes.map(function(note, idx) {
      let opts = {
        goal: true,
        offset: keySignatureWidth + this.props.noteWidth * idx,
        first: idx == 0,
      }

      if (Array.isArray(note)) {
        return note.map(function(sub_note, col_idx) {
          opts.key = `${idx}-${col_idx}`;
          return this.renderNote(sub_note, opts);
        }.bind(this));
      } else {
        opts.key = idx;
        return this.renderNote(note, opts);
      }

    }.bind(this));
  }

  renderLedgerLines(note, opts={}) {
    let pitch = parseNote(note);
    let fromLeft =  opts.offset || 0;
    let letterDelta = 0;
    let below = false;

    // above
    if (pitch > this.props.upperLine) {
      letterDelta = letterOffset(pitch) - letterOffset(this.props.upperLine);
    }

    // below
    if (pitch < this.props.lowerLine) {
      letterDelta = letterOffset(this.props.lowerLine) - letterOffset(pitch);
      below = true;
    }

    let numLines = Math.floor(letterDelta / 2);

    let lines = [];
    for (let i = 0; i < numLines; i++) {
      let style = {
        left: `${(opts.offset || 0) - 10}px`,
        width: `${40 + 20}`,
      }

      if (below) {
        style.top = `${100 + 25*(i + 1)}%`;
      } else {
        style.bottom = `${100 + 25*(i + 1)}%`;
      }

      lines.push(<div
        className={classNames("ledger_line", {
          above: !below,
          below: below
        })}
        style={style} />);
    }

    return lines;
  }

  renderNote(note, opts={}) {
    let pitch = parseNote(note);

    if (this.props.inGrand) {
      switch (this.props.staffClass) {
        case "f_staff":  // lower
          if (pitch >= MIDDLE_C_PITCH) {
            return;
          }
          break;
        case "g_staff":  // upper
          if (pitch < MIDDLE_C_PITCH) {
            return;
          }
          break;
      }
    }

    let fromTop = letterOffset(this.props.upperLine) - letterOffset(pitch);

    let style = {
      top: `${Math.floor(fromTop * 25/2)}%`,
      left: `${opts.offset || 0}px`
    }

    let outside = pitch > this.props.upperLine || pitch < this.props.lowerLine;

    let classes = classNames("whole_note", "note", {
      outside: outside,
      noteshake: this.props.noteShaking && opts.first,
      held: opts.goal && opts.first && this.props.heldNotes[note],
    }, opts.classes || {})

    let noteEl = <img
      key={opts.key}
      style={style}
      data-note={note}
      data-midi-note={pitch}
      className={classes}
      src="svg/noteheads.s0.svg" />;

    if (outside) {
      return [
        noteEl,
        this.renderLedgerLines(note, opts),
      ];
    } else {
      return noteEl;
    }
  }
}

class GStaff extends Staff {
  static defaultProps = {
    upperLine: 77,
    lowerLine: 64,
    cleffImage: "svg/clefs.G.svg",
    staffClass: "g_staff",
  }
}

class FStaff extends Staff {
  static defaultProps = {
    upperLine: 57,
    lowerLine: 57 - 13,
    cleffImage: "svg/clefs.F_change.svg",
    staffClass: "f_staff",
  }
}

class GrandStaff extends React.Component {
  // skips react for performance
  setOffset(amount) {
    if (!this.gstaff) {
      return;
    }

    this.gstaff.setOffset(amount);
    this.fstaff.setOffset(amount);
  }

  render() {
    return <div className="grand_staff">
      <GStaff
        ref={(s) => this.gstaff = s}
        inGrand={true}
        {...this.props} />
      <FStaff
        ref={(s) => this.fstaff = s}
        inGrand={true}
        {...this.props} />
    </div>;
  }
}
