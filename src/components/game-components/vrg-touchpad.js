
import { html, css } from 'lit-element';
import { VrgBase } from '../../vrg-base.js'

export class VrgTouchpad extends VrgBase {
    //we need to init values in constructor

    static get properties() {
        return {
            open: Boolean,
            pad:Number,
        }
    }

    constructor(){
        super();
        this.pad = 5;
        this.open = false;
    }

    get selfStyles() {
        return css`
            .base{
                background-color: var(--shade-color);
                color: var(--success-color);
                border-radius: 2px;
                display: inline-block;
                margin: 1rem;
                position: relative;
                box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
                transition: all 0.3s cubic-bezier(.25,.8,.25,1);
                padding: 1em;
            }
            .controls{
                animation-duration: 4s;
            }
            .close{
                display:none;
            }
            .btn{
                margin:2px;
                background-color:grey;
            }
            .btn:hover{
                background-color:lightgrey;
            }`
    }

    sendEvent(btn){
        console.log('events touchpad ', btn+':'+this.pad);
        this.emit('btn-control', btn+':'+this.pad)
    }

    render() {
        return html`
        ${this.styles}
        <div class="base">
            <div @click="${e=>this.open = !this.open}" class="opener">
                ${this.open ? 'hide' : 'show'}
            </div>
            <div class="controls flex-box f-vertical f-j-center ${this.open ? 'open' : 'close'}">
                <div class="btn btn-ctrl" @click="${e=>this.sendEvent('up')}" @touch="${e=>this.sendEvent('up')}">
                    haut
                </div>
                <div class="flex-box f-horizontal f-j-space">
                    <div class="btn btn-ctrl" @click="${e=>this.sendEvent('left')}" @touch="${e=>this.sendEvent('left')}">
                        gauche
                    </div>
                    <div class="btn btn-ctrl" @click="${e=>this.sendEvent('right')}" @touch="${e=>this.sendEvent('right')}">
                        droite
                    </div>
                </div>
                <div class="btn btn-ctrl" @click="${e=>this.sendEvent('down')}" @touch="${e=>this.sendEvent('down')}">
                    bas
                </div>
                <div class="flex-box f-horizontal f-j-space">
                    <div class="btn btn-ctrl" @click="${e=>this.sendEvent('zup')}" @touch="${e=>this.sendEvent('zup')}">
                        zoom -
                    </div>
                    <div class="btn btn-ctrl" @click="${e=>this.sendEvent('zdown')}" @touch="${e=>this.sendEvent('zdown')}">
                        zoom +
                    </div>
                </div>
            </div>
        </div>`
    }
}
customElements.define('vrg-touchpad', VrgTouchpad); 
