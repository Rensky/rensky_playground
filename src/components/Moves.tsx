export type Move = {
    name: string;
    id: number;
    ori_name: string;
};

export type MovesData = {
    movesProps: Move[];
};

export const Moves = ({ movesProps }: MovesData) => {
    return (
        <>
            {movesProps.map((move, index) => {
                const { name, id, ori_name } = move;
                return (
                    <div
                        key={`moves_${id}_${ori_name}_${
                            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                            index
                        }`}
                        className='bg-gray-100 text-black px-3 py-1 rounded-full shadow mb-2'
                    >
                        {name}
                    </div>
                );
            })}
        </>
    );
};
