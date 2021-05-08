import {Callback, NodePathSegmentFormatter, NodeType} from "./types";
import {defaultPathFormatter} from "./defaults";

const getNormalizedType = (val: any): NodeType =>
{
    return Array.isArray(val)
        ? 'array'
        : typeof val === 'object'
        ? 'object'
        : 'value';
}

export class WalkNode {
    private _children?: WalkNode[] = undefined
    private static _idx: number = 0;
    public readonly id: number;

    constructor(
        public val: any,
        public isRoot: boolean = false,
        public isArrayMember: boolean = false,
        public nodeType: NodeType = 'value',
        public rawType: string = 'undefined',
        public executedCallbacks: Callback<any>[] = [],
        public key?: string | number,
        public parent?: WalkNode,) {
        this.id = WalkNode._idx++;
    }

    public static fromRoot(obj: any): WalkNode {
        return new WalkNode(
            obj, true, false, getNormalizedType(obj), typeof obj,
            [], undefined, undefined
        )
    }

    public static fromObjectKey(parent: WalkNode, key: string): WalkNode {
        return new WalkNode(
            parent.val[key], false, false, getNormalizedType(parent.val[key]), typeof parent.val[key],
            [], key, parent
        )
    }

    public static fromArrayIndex(parent: WalkNode, index: number): WalkNode {
        return new WalkNode(
            parent.val[index], false, true, getNormalizedType(parent.val[index]), typeof parent.val[index],
            [], index, parent
        )
    }

    public getPath(pathFormat?: NodePathSegmentFormatter): string {
        if (this.isRoot)
            return ""

        pathFormat = pathFormat || defaultPathFormatter
        return this.parent!.getPath(pathFormat) + pathFormat(this)
    }

    public get children(): WalkNode[] {
        if (typeof this._children === 'undefined')
            this._children = [...this.getChildren()];

        return this._children;
    }

    public * getChildren(): Generator<WalkNode> {
        if (this.nodeType === 'array')
        {
            for (let i = 0; i < this.val.length; i++)
                yield WalkNode.fromArrayIndex(this, i)
        }
        else if (this.nodeType === 'object'){
            if(this.val === null)
                return
            for (let key of Object.keys(this.val))
                yield WalkNode.fromObjectKey(this, key)
        }
    }

    public get siblings(): WalkNode[] {
        return this.parent?.children.filter(c => c.id !== this.id) ?? []
    }
}
